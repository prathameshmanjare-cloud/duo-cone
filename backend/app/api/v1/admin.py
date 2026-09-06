"""Admin CMS API — everything shopping-related an operator manages.

All routes require a logged-in user with ``is_admin`` (see ``require_admin``).
Grouped: dashboard, products, inventory, brands, categories, orders, rfqs.
"""

from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import require_admin
from app.auth.security import hash_password
from app.db.session import get_db
from app.models.catalog import (
    Brand,
    Category,
    CrossReference,
    Inventory,
    Product,
    ProductCategory,
    ProductImage,
)
from app.models.commerce import Order, OrderStatus, Rfq, User
from app.schemas.admin import (
    BrandIn,
    BrandOut,
    BrandUpdateIn,
    CategoryIn,
    CategoryOut,
    CategoryUpdateIn,
    CrossRefIn,
    CrossRefOut,
    DashboardStats,
    InventoryIn,
    InventoryOut,
    OrderAdminOut,
    OrderStatusIn,
    PagedOrders,
    PagedProductsAdmin,
    PagedRfqs,
    PagedUsers,
    PasswordResetIn,
    ProductAdminOut,
    ProductCreateIn,
    ProductImageIn,
    ProductImageOut,
    ProductImagePatchIn,
    ProductUpdateIn,
    RfqAdminOut,
    RfqStatusIn,
    UserAdminOut,
    UserUpdateIn,
)
from app.services.export import export_response

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

LOW_STOCK_THRESHOLD = 5


def _slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return value.strip("-") or "item"


# ============================================================== dashboard ====
@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db)) -> DashboardStats:
    scalar = lambda stmt: db.scalar(stmt)  # noqa: E731

    products_total = await scalar(select(func.count()).select_from(Product))
    products_active = await scalar(
        select(func.count()).select_from(Product).where(Product.is_active.is_(True))
    )
    products_rfq_only = await scalar(
        select(func.count()).select_from(Product).where(Product.is_rfq_only.is_(True))
    )
    out_of_stock = await scalar(
        select(func.count()).select_from(Inventory).where(Inventory.stock_qty <= 0)
    )
    low_stock = await scalar(
        select(func.count())
        .select_from(Inventory)
        .where(Inventory.stock_qty > 0, Inventory.stock_qty <= LOW_STOCK_THRESHOLD)
    )
    brands_total = await scalar(select(func.count()).select_from(Brand))
    categories_total = await scalar(select(func.count()).select_from(Category))
    orders_total = await scalar(select(func.count()).select_from(Order))
    orders_pending = await scalar(
        select(func.count()).select_from(Order).where(Order.status == OrderStatus.pending)
    )
    revenue_cents = await scalar(
        select(func.coalesce(func.sum(Order.total_cents), 0)).where(
            Order.status.in_(
                [OrderStatus.paid, OrderStatus.processing, OrderStatus.shipped, OrderStatus.completed]
            )
        )
    )
    rfqs_total = await scalar(select(func.count()).select_from(Rfq))
    rfqs_new = await scalar(
        select(func.count()).select_from(Rfq).where(Rfq.status == "new")
    )
    users_total = await scalar(select(func.count()).select_from(User))

    return DashboardStats(
        products_total=products_total or 0,
        products_active=products_active or 0,
        products_rfq_only=products_rfq_only or 0,
        out_of_stock=out_of_stock or 0,
        low_stock=low_stock or 0,
        brands_total=brands_total or 0,
        categories_total=categories_total or 0,
        orders_total=orders_total or 0,
        orders_pending=orders_pending or 0,
        revenue_cents=revenue_cents or 0,
        rfqs_total=rfqs_total or 0,
        rfqs_new=rfqs_new or 0,
        users_total=users_total or 0,
    )


# =============================================================== products ====
async def _get_product_or_404(db: AsyncSession, product_id: uuid.UUID) -> Product:
    product = (
        await db.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.inventory))
        )
    ).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/products", response_model=PagedProductsAdmin)
async def list_products(
    db: AsyncSession = Depends(get_db),
    q: str | None = None,
    brand_id: int | None = None,
    is_active: bool | None = None,
    is_rfq_only: bool | None = None,
    stock: str | None = Query(None, description="out | low"),
    sort: str = "name",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> PagedProductsAdmin:
    stmt = select(Product).options(selectinload(Product.inventory))

    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Product.name.ilike(like), Product.sku.ilike(like), Product.slug.ilike(like))
        )
    if brand_id is not None:
        stmt = stmt.where(Product.brand_id == brand_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active.is_(is_active))
    if is_rfq_only is not None:
        stmt = stmt.where(Product.is_rfq_only.is_(is_rfq_only))
    if stock in ("out", "low"):
        stmt = stmt.join(Inventory, Inventory.product_id == Product.id)
        if stock == "out":
            stmt = stmt.where(Inventory.stock_qty <= 0)
        else:
            stmt = stmt.where(Inventory.stock_qty > 0, Inventory.stock_qty <= LOW_STOCK_THRESHOLD)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    order_map = {
        "name": Product.name.asc(),
        "price_asc": Product.price_cents.asc(),
        "price_desc": Product.price_cents.desc(),
        "latest": Product.created_at.desc(),
        "sku": Product.sku.asc(),
    }
    stmt = stmt.order_by(order_map.get(sort, Product.name.asc()))
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()

    return PagedProductsAdmin(
        items=[ProductAdminOut.model_validate(p) for p in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/products", response_model=ProductAdminOut, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreateIn, db: AsyncSession = Depends(get_db)) -> ProductAdminOut:
    data = payload.model_dump(exclude_unset=False)
    stock_qty = data.pop("stock_qty", None)
    slug = data.get("slug") or _slugify(f"{data['name']}-{data['sku']}")
    data["slug"] = slug

    if payload.brand_id is not None:
        brand = await db.get(Brand, payload.brand_id)
        if brand is None:
            raise HTTPException(status_code=422, detail="brand_id does not exist")

    product = Product(**data)
    db.add(product)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A product with that slug or SKU already exists")

    db.add(Inventory(product_id=product.id, stock_qty=stock_qty or 0))
    await db.commit()

    return await _serialize_product(db, product.id)


@router.get("/products/{product_id}", response_model=ProductAdminOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> ProductAdminOut:
    await _get_product_or_404(db, product_id)
    return await _serialize_product(db, product_id)


@router.patch("/products/{product_id}", response_model=ProductAdminOut)
async def update_product(
    product_id: uuid.UUID, payload: ProductUpdateIn, db: AsyncSession = Depends(get_db)
) -> ProductAdminOut:
    product = await _get_product_or_404(db, product_id)
    changes = payload.model_dump(exclude_unset=True)

    if "brand_id" in changes and changes["brand_id"] is not None:
        if await db.get(Brand, changes["brand_id"]) is None:
            raise HTTPException(status_code=422, detail="brand_id does not exist")

    for field, value in changes.items():
        setattr(product, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="slug or SKU already in use")

    return await _serialize_product(db, product_id)


@router.delete("/products/{product_id}")
async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    product = await _get_product_or_404(db, product_id)
    await db.execute(ProductImage.__table__.delete().where(ProductImage.product_id == product_id))
    await db.execute(
        ProductCategory.__table__.delete().where(ProductCategory.product_id == product_id)
    )
    await db.execute(Inventory.__table__.delete().where(Inventory.product_id == product_id))
    await db.delete(product)
    await db.commit()


@router.put("/products/{product_id}/inventory", response_model=InventoryOut)
async def set_inventory(
    product_id: uuid.UUID, payload: InventoryIn, db: AsyncSession = Depends(get_db)
) -> InventoryOut:
    await _get_product_or_404(db, product_id)
    inv = await db.get(Inventory, product_id)
    if inv is None:
        inv = Inventory(product_id=product_id)
        db.add(inv)
    inv.stock_qty = payload.stock_qty
    inv.backorder = payload.backorder
    inv.lead_time_days = payload.lead_time_days
    inv.warehouse = payload.warehouse
    await db.commit()
    await db.refresh(inv)
    return InventoryOut.model_validate(inv)


async def _serialize_product(db: AsyncSession, product_id: uuid.UUID) -> ProductAdminOut:
    product = (
        await db.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.inventory))
        )
    ).scalar_one()
    return ProductAdminOut.model_validate(product)


# ================================================================= brands ====
@router.get("/brands", response_model=list[BrandOut])
async def list_brands(db: AsyncSession = Depends(get_db)) -> list[BrandOut]:
    counts = dict(
        (
            await db.execute(
                select(Product.brand_id, func.count()).group_by(Product.brand_id)
            )
        ).all()
    )
    brands = (await db.execute(select(Brand).order_by(Brand.name))).scalars().all()
    out = []
    for b in brands:
        item = BrandOut.model_validate(b)
        item.product_count = counts.get(b.id, 0)
        out.append(item)
    return out


@router.post("/brands", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
async def create_brand(payload: BrandIn, db: AsyncSession = Depends(get_db)) -> BrandOut:
    brand = Brand(**payload.model_dump())
    db.add(brand)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Brand slug already exists")
    await db.refresh(brand)
    return BrandOut.model_validate(brand)


@router.patch("/brands/{brand_id}", response_model=BrandOut)
async def update_brand(
    brand_id: int, payload: BrandUpdateIn, db: AsyncSession = Depends(get_db)
) -> BrandOut:
    brand = await db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(brand, field, value)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Brand slug already exists")
    await db.refresh(brand)
    return BrandOut.model_validate(brand)


@router.delete("/brands/{brand_id}")
async def delete_brand(brand_id: int, db: AsyncSession = Depends(get_db)) -> None:
    brand = await db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")
    in_use = await db.scalar(
        select(func.count()).select_from(Product).where(Product.brand_id == brand_id)
    )
    if in_use:
        raise HTTPException(
            status_code=409, detail=f"Brand is assigned to {in_use} product(s); reassign them first"
        )
    await db.delete(brand)
    await db.commit()


# ============================================================= categories ====
@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryOut]:
    cats = (await db.execute(select(Category).order_by(Category.sort, Category.name))).scalars().all()
    return [CategoryOut.model_validate(c) for c in cats]


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryIn, db: AsyncSession = Depends(get_db)) -> CategoryOut:
    cat = Category(**payload.model_dump())
    db.add(cat)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Category slug already exists")
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: int, payload: CategoryUpdateIn, db: AsyncSession = Depends(get_db)
) -> CategoryOut:
    cat = await db.get(Category, category_id)
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("parent_id") == category_id:
        raise HTTPException(status_code=422, detail="A category cannot be its own parent")
    for field, value in changes.items():
        setattr(cat, field, value)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Category slug already exists")
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)) -> None:
    cat = await db.get(Category, category_id)
    if cat is None:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.execute(
        ProductCategory.__table__.delete().where(ProductCategory.category_id == category_id)
    )
    await db.execute(Category.__table__.update().where(Category.parent_id == category_id).values(parent_id=None))
    await db.delete(cat)
    await db.commit()


# ================================================================= orders ====
@router.get("/orders", response_model=PagedOrders)
async def list_orders(
    db: AsyncSession = Depends(get_db),
    q: str | None = None,
    status_filter: OrderStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> PagedOrders:
    stmt = select(Order).options(selectinload(Order.items))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Order.number.ilike(like), Order.email.ilike(like)))
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()
    return PagedOrders(
        items=[OrderAdminOut.model_validate(o) for o in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/orders/{order_id}", response_model=OrderAdminOut)
async def get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> OrderAdminOut:
    order = (
        await db.execute(
            select(Order).where(Order.id == order_id).options(selectinload(Order.items))
        )
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderAdminOut.model_validate(order)


@router.patch("/orders/{order_id}", response_model=OrderAdminOut)
async def update_order_status(
    order_id: uuid.UUID, payload: OrderStatusIn, db: AsyncSession = Depends(get_db)
) -> OrderAdminOut:
    order = (
        await db.execute(
            select(Order).where(Order.id == order_id).options(selectinload(Order.items))
        )
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    await db.commit()
    await db.refresh(order)
    return OrderAdminOut.model_validate(order)


# =================================================================== rfqs ====
@router.get("/rfqs", response_model=PagedRfqs)
async def list_rfqs(
    db: AsyncSession = Depends(get_db),
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> PagedRfqs:
    stmt = select(Rfq).options(selectinload(Rfq.items))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Rfq.number.ilike(like), Rfq.email.ilike(like), Rfq.company.ilike(like))
        )
    if status_filter:
        stmt = stmt.where(Rfq.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(Rfq.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().unique().all()
    return PagedRfqs(
        items=[RfqAdminOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/rfqs/{rfq_id}", response_model=RfqAdminOut)
async def get_rfq(rfq_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> RfqAdminOut:
    rfq = (
        await db.execute(select(Rfq).where(Rfq.id == rfq_id).options(selectinload(Rfq.items)))
    ).scalar_one_or_none()
    if rfq is None:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return RfqAdminOut.model_validate(rfq)


@router.patch("/rfqs/{rfq_id}", response_model=RfqAdminOut)
async def update_rfq_status(
    rfq_id: uuid.UUID, payload: RfqStatusIn, db: AsyncSession = Depends(get_db)
) -> RfqAdminOut:
    rfq = (
        await db.execute(select(Rfq).where(Rfq.id == rfq_id).options(selectinload(Rfq.items)))
    ).scalar_one_or_none()
    if rfq is None:
        raise HTTPException(status_code=404, detail="RFQ not found")
    rfq.status = payload.status
    await db.commit()
    await db.refresh(rfq)
    return RfqAdminOut.model_validate(rfq)


# ================================================================== users ====
async def _user_counts(db: AsyncSession, user_ids: list[uuid.UUID]) -> dict:
    if not user_ids:
        return {}
    orders = dict(
        (
            await db.execute(
                select(Order.user_id, func.count())
                .where(Order.user_id.in_(user_ids))
                .group_by(Order.user_id)
            )
        ).all()
    )
    rfqs = dict(
        (
            await db.execute(
                select(Rfq.user_id, func.count())
                .where(Rfq.user_id.in_(user_ids))
                .group_by(Rfq.user_id)
            )
        ).all()
    )
    return {uid: (orders.get(uid, 0), rfqs.get(uid, 0)) for uid in user_ids}


def _user_out(u: User, counts: dict) -> UserAdminOut:
    item = UserAdminOut.model_validate(u)
    oc, rc = counts.get(u.id, (0, 0))
    item.order_count = oc
    item.rfq_count = rc
    return item


@router.get("/users", response_model=PagedUsers)
async def list_users(
    db: AsyncSession = Depends(get_db),
    q: str | None = None,
    is_admin: bool | None = None,
    is_verified: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> PagedUsers:
    stmt = select(User)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(User.email.ilike(like), User.full_name.ilike(like), User.company_name.ilike(like))
        )
    if is_admin is not None:
        stmt = stmt.where(User.is_admin.is_(is_admin))
    if is_verified is not None:
        stmt = stmt.where(User.is_verified.is_(is_verified))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    counts = await _user_counts(db, [u.id for u in rows])
    return PagedUsers(
        items=[_user_out(u, counts) for u in rows], total=total, page=page, page_size=page_size
    )


@router.get("/users/{user_id}", response_model=UserAdminOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> UserAdminOut:
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found")
    counts = await _user_counts(db, [u.id])
    return _user_out(u, counts)


@router.patch("/users/{user_id}", response_model=UserAdminOut)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateIn,
    db: AsyncSession = Depends(get_db),
    me: User = Depends(require_admin),
) -> UserAdminOut:
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found")
    changes = payload.model_dump(exclude_unset=True)
    if u.id == me.id and changes.get("is_admin") is False:
        raise HTTPException(status_code=422, detail="You cannot remove your own admin access")
    for field, value in changes.items():
        setattr(u, field, value)
    await db.commit()
    counts = await _user_counts(db, [u.id])
    return _user_out(u, counts)


@router.post("/users/{user_id}/password", response_model=UserAdminOut)
async def reset_user_password(
    user_id: uuid.UUID, payload: PasswordResetIn, db: AsyncSession = Depends(get_db)
) -> UserAdminOut:
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found")
    u.password_hash = hash_password(payload.password)
    await db.commit()
    counts = await _user_counts(db, [u.id])
    return _user_out(u, counts)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID, db: AsyncSession = Depends(get_db), me: User = Depends(require_admin)
) -> None:
    if user_id == me.id:
        raise HTTPException(status_code=422, detail="You cannot delete your own account")
    u = await db.get(User, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found")
    # detach references rather than cascade-deleting order history
    await db.execute(Order.__table__.update().where(Order.user_id == user_id).values(user_id=None))
    await db.execute(Rfq.__table__.update().where(Rfq.user_id == user_id).values(user_id=None))
    await db.delete(u)
    await db.commit()


# ============================================== product cross-references ====
@router.get("/products/{product_id}/cross-references", response_model=list[CrossRefOut])
async def list_cross_refs(
    product_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> list[CrossRefOut]:
    await _get_product_or_404(db, product_id)
    rows = (
        await db.execute(
            select(CrossReference)
            .where(CrossReference.product_id == product_id)
            .order_by(CrossReference.ref_number)
        )
    ).scalars().all()
    return [CrossRefOut.model_validate(r) for r in rows]


@router.post(
    "/products/{product_id}/cross-references",
    response_model=CrossRefOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_cross_ref(
    product_id: uuid.UUID, payload: CrossRefIn, db: AsyncSession = Depends(get_db)
) -> CrossRefOut:
    await _get_product_or_404(db, product_id)
    row = CrossReference(product_id=product_id, **payload.model_dump())
    db.add(row)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="That reference number already exists on this product")
    await db.refresh(row)
    return CrossRefOut.model_validate(row)


@router.delete("/products/{product_id}/cross-references/{ref_id}")
async def delete_cross_ref(
    product_id: uuid.UUID, ref_id: int, db: AsyncSession = Depends(get_db)
) -> None:
    row = await db.get(CrossReference, ref_id)
    if row is None or row.product_id != product_id:
        raise HTTPException(status_code=404, detail="Cross-reference not found")
    await db.delete(row)
    await db.commit()


# ======================================================= product images ====
@router.get("/products/{product_id}/images", response_model=list[ProductImageOut])
async def list_images(
    product_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> list[ProductImageOut]:
    await _get_product_or_404(db, product_id)
    rows = (
        await db.execute(
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .order_by(ProductImage.position, ProductImage.id)
        )
    ).scalars().all()
    return [ProductImageOut.model_validate(r) for r in rows]


@router.post(
    "/products/{product_id}/images",
    response_model=ProductImageOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_image(
    product_id: uuid.UUID, payload: ProductImageIn, db: AsyncSession = Depends(get_db)
) -> ProductImageOut:
    await _get_product_or_404(db, product_id)
    row = ProductImage(product_id=product_id, **payload.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return ProductImageOut.model_validate(row)


@router.patch("/products/{product_id}/images/{image_id}", response_model=ProductImageOut)
async def update_image(
    product_id: uuid.UUID,
    image_id: int,
    payload: ProductImagePatchIn,
    db: AsyncSession = Depends(get_db),
) -> ProductImageOut:
    row = await db.get(ProductImage, image_id)
    if row is None or row.product_id != product_id:
        raise HTTPException(status_code=404, detail="Image not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    await db.commit()
    await db.refresh(row)
    return ProductImageOut.model_validate(row)


@router.delete("/products/{product_id}/images/{image_id}")
async def delete_image(
    product_id: uuid.UUID, image_id: int, db: AsyncSession = Depends(get_db)
) -> None:
    row = await db.get(ProductImage, image_id)
    if row is None or row.product_id != product_id:
        raise HTTPException(status_code=404, detail="Image not found")
    await db.delete(row)
    await db.commit()


# ================================================================ exports ====
def _euros(cents) -> str:
    return "" if cents is None else f"{cents / 100:.2f}"


@router.get("/export/products")
async def export_products(
    db: AsyncSession = Depends(get_db),
    fmt: str = Query("csv", pattern="^(csv|pdf)$"),
    q: str | None = None,
    brand_id: int | None = None,
    is_active: bool | None = None,
    is_rfq_only: bool | None = None,
    stock: str | None = None,
):
    stmt = select(Product).options(selectinload(Product.inventory), selectinload(Product.brand))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Product.name.ilike(like), Product.sku.ilike(like), Product.slug.ilike(like))
        )
    if brand_id is not None:
        stmt = stmt.where(Product.brand_id == brand_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active.is_(is_active))
    if is_rfq_only is not None:
        stmt = stmt.where(Product.is_rfq_only.is_(is_rfq_only))
    if stock in ("out", "low"):
        stmt = stmt.join(Inventory, Inventory.product_id == Product.id)
        if stock == "out":
            stmt = stmt.where(Inventory.stock_qty <= 0)
        else:
            stmt = stmt.where(Inventory.stock_qty > 0, Inventory.stock_qty <= LOW_STOCK_THRESHOLD)
    stmt = stmt.order_by(Product.name.asc())
    rows = (await db.execute(stmt)).scalars().unique().all()

    data = [
        {
            "sku": p.sku,
            "name": p.name,
            "brand": p.brand.name if p.brand else "",
            "seal_type": p.seal_type.value,
            "price": _euros(p.price_cents),
            "sale_price": _euros(p.sale_price_cents),
            "currency": p.currency,
            "stock_qty": p.inventory.stock_qty if p.inventory else 0,
            "is_active": p.is_active,
            "is_rfq_only": p.is_rfq_only,
        }
        for p in rows
    ]
    columns = [
        ("sku", "SKU"),
        ("name", "Name"),
        ("brand", "Brand"),
        ("seal_type", "Type"),
        ("price", "Price"),
        ("sale_price", "Sale"),
        ("currency", "Cur"),
        ("stock_qty", "Stock"),
        ("is_active", "Active"),
        ("is_rfq_only", "Quote-only"),
    ]
    return export_response(fmt, "products", "DuoCone — Products & stock", data, columns)


@router.get("/export/orders")
async def export_orders(
    db: AsyncSession = Depends(get_db),
    fmt: str = Query("csv", pattern="^(csv|pdf)$"),
    q: str | None = None,
    status_filter: OrderStatus | None = Query(None, alias="status"),
):
    stmt = select(Order)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Order.number.ilike(like), Order.email.ilike(like)))
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    stmt = stmt.order_by(Order.created_at.desc())
    rows = (await db.execute(stmt)).scalars().all()

    data = [
        {
            "number": o.number,
            "created_at": o.created_at,
            "email": o.email,
            "status": o.status.value,
            "subtotal": _euros(o.subtotal_cents),
            "shipping": _euros(o.shipping_cents),
            "tax": _euros(o.tax_cents),
            "total": _euros(o.total_cents),
            "currency": o.currency,
        }
        for o in rows
    ]
    columns = [
        ("number", "Number"),
        ("created_at", "Date"),
        ("email", "Email"),
        ("status", "Status"),
        ("subtotal", "Subtotal"),
        ("shipping", "Shipping"),
        ("tax", "Tax"),
        ("total", "Total"),
        ("currency", "Cur"),
    ]
    return export_response(fmt, "orders", "DuoCone — Orders", data, columns)


@router.get("/export/rfqs")
async def export_rfqs(
    db: AsyncSession = Depends(get_db),
    fmt: str = Query("csv", pattern="^(csv|pdf)$"),
    q: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
):
    stmt = select(Rfq).options(selectinload(Rfq.items))
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(Rfq.number.ilike(like), Rfq.email.ilike(like), Rfq.company.ilike(like))
        )
    if status_filter:
        stmt = stmt.where(Rfq.status == status_filter)
    stmt = stmt.order_by(Rfq.created_at.desc())
    rows = (await db.execute(stmt)).scalars().unique().all()

    data = [
        {
            "number": r.number,
            "created_at": r.created_at,
            "email": r.email,
            "company": r.company or "",
            "country": r.country_code or "",
            "status": r.status.value,
            "items": len(r.items),
        }
        for r in rows
    ]
    columns = [
        ("number", "Number"),
        ("created_at", "Date"),
        ("email", "Email"),
        ("company", "Company"),
        ("country", "Country"),
        ("status", "Status"),
        ("items", "Items"),
    ]
    return export_response(fmt, "rfqs", "DuoCone — RFQs", data, columns)


@router.get("/export/users")
async def export_users(
    db: AsyncSession = Depends(get_db),
    fmt: str = Query("csv", pattern="^(csv|pdf)$"),
    q: str | None = None,
    is_admin: bool | None = None,
    is_verified: bool | None = None,
):
    stmt = select(User)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(User.email.ilike(like), User.full_name.ilike(like), User.company_name.ilike(like))
        )
    if is_admin is not None:
        stmt = stmt.where(User.is_admin.is_(is_admin))
    if is_verified is not None:
        stmt = stmt.where(User.is_verified.is_(is_verified))
    stmt = stmt.order_by(User.created_at.desc())
    rows = (await db.execute(stmt)).scalars().all()
    counts = await _user_counts(db, [u.id for u in rows])

    data = [
        {
            "email": u.email,
            "full_name": u.full_name or "",
            "company_name": u.company_name or "",
            "vat_id": u.vat_id or "",
            "phone": u.phone or "",
            "is_verified": u.is_verified,
            "is_admin": u.is_admin,
            "orders": counts.get(u.id, (0, 0))[0],
            "rfqs": counts.get(u.id, (0, 0))[1],
            "created_at": u.created_at,
        }
        for u in rows
    ]
    columns = [
        ("email", "Email"),
        ("full_name", "Name"),
        ("company_name", "Company"),
        ("vat_id", "VAT ID"),
        ("phone", "Phone"),
        ("is_verified", "Verified"),
        ("is_admin", "Admin"),
        ("orders", "Orders"),
        ("rfqs", "RFQs"),
        ("created_at", "Joined"),
    ]
    return export_response(fmt, "users", "DuoCone — Users", data, columns)


@router.get("/export/brands")
async def export_brands(
    db: AsyncSession = Depends(get_db), fmt: str = Query("csv", pattern="^(csv|pdf)$")
):
    counts = dict(
        (
            await db.execute(select(Product.brand_id, func.count()).group_by(Product.brand_id))
        ).all()
    )
    brands = (await db.execute(select(Brand).order_by(Brand.name))).scalars().all()
    data = [
        {
            "name": b.name,
            "slug": b.slug,
            "segment": b.segment.value,
            "products": counts.get(b.id, 0),
        }
        for b in brands
    ]
    columns = [
        ("name", "Name"),
        ("slug", "Slug"),
        ("segment", "Segment"),
        ("products", "Products"),
    ]
    return export_response(fmt, "brands", "DuoCone — Brands", data, columns)


@router.get("/export/categories")
async def export_categories(
    db: AsyncSession = Depends(get_db), fmt: str = Query("csv", pattern="^(csv|pdf)$")
):
    cats = (
        await db.execute(select(Category).order_by(Category.sort, Category.name))
    ).scalars().all()
    by_id = {c.id: c for c in cats}
    data = [
        {
            "name": c.name,
            "slug": c.slug,
            "parent": by_id[c.parent_id].name if c.parent_id in by_id else "",
            "segment": c.segment.value if c.segment else "",
            "sort": c.sort,
        }
        for c in cats
    ]
    columns = [
        ("name", "Name"),
        ("slug", "Slug"),
        ("parent", "Parent"),
        ("segment", "Segment"),
        ("sort", "Sort"),
    ]
    return export_response(fmt, "categories", "DuoCone — Categories", data, columns)
