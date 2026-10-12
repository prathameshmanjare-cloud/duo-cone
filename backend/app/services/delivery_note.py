"""PDF delivery note for a paid order.

Shares the invoice's branding (logo, seller details, footer) but follows the
client's delivery-note reference (``Delivery_note_19244``): sender line above
the consignee address, reference block on the right, "Delivery note" title
with number/date/order no., a Pos./Product/Description/Quantity table with
no prices, then shipment details and payment type.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fpdf import FPDF
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.models.commerce import Order, delivery_note_number_seq
from app.services.invoice import (
    _LOGO_H_MM,
    _LOGO_PATH,
    _LOGO_W_MM,
    _address_lines,
    _draw_footer,
    _latin1,
)

settings = get_settings()

# customs tariff heading for mechanical seals — the default for every shipment
DEFAULT_HS_CODE = "84842000"

_LEFT = 15
_RIGHT_COL_X = 105
_PAGE_W = 180  # A4 minus 15mm margins


async def assign_delivery_note_number(db: AsyncSession, order: Order) -> None:
    """Give the order its delivery note number if it has none. Caller commits."""
    if order.delivery_note_number:
        return
    seq = await db.scalar(delivery_note_number_seq.next_value())
    order.delivery_note_number = f"DN-{datetime.now(timezone.utc).year}-{seq:05d}"


def _issue_date(order: Order) -> str:
    raw = (order.delivery_note or {}).get("issued_at")
    try:
        issued = datetime.fromisoformat(raw) if raw else datetime.now(timezone.utc)
    except ValueError:
        issued = datetime.now(timezone.utc)
    return issued.strftime("%d.%m.%Y")


def build_delivery_note_pdf(order: Order) -> bytes:
    note = order.delivery_note or {}
    addr = order.shipping_address or order.billing_address or {}

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_margins(_LEFT, 15, _LEFT)
    pdf.set_auto_page_break(auto=True, margin=30)
    pdf.add_page()

    y_top = pdf.get_y()
    if _LOGO_PATH.exists():
        pdf.image(str(_LOGO_PATH), x=pdf.w - _LEFT - _LOGO_W_MM, y=y_top, w=_LOGO_W_MM, h=_LOGO_H_MM)
    else:
        pdf.set_font("Helvetica", "B", 20)
        pdf.cell(0, 10, "DUO-CONE", align="R")

    # sender line, sized to sit above a window-envelope address
    y_block = y_top + _LOGO_H_MM + 14
    pdf.set_xy(_LEFT, y_block)
    pdf.set_font("Helvetica", "", 7)
    sender = _latin1(f"{settings.invoice_seller_name}, {settings.invoice_seller_address}")
    sender_w = pdf.get_string_width(sender) + 2
    pdf.cell(sender_w, 4, sender)
    pdf.line(_LEFT, y_block + 4.5, _LEFT + sender_w, y_block + 4.5)

    pdf.set_xy(_LEFT, y_block + 6)
    pdf.set_font("Helvetica", "", 10)
    for line in _address_lines(addr):
        pdf.cell(85, 5, line, new_x="LMARGIN", new_y="NEXT")
    y_after_address = pdf.get_y()

    ref_rows = [
        ("Customer e-mail", order.email),
        ("Tel.", addr.get("phone") or ""),
        ("VAT ID", order.vat_id or ""),
        ("EORI", note.get("eori") or ""),
        ("Invoice no.", order.invoice_number or ""),
        ("Our contact", settings.sales_email),
    ]
    pdf.set_font("Helvetica", "", 9)
    y = y_block + 6
    for label, value in ref_rows:
        if not value:
            continue
        pdf.set_xy(_RIGHT_COL_X, y)
        pdf.cell(35, 5, label)
        pdf.cell(55, 5, _latin1(str(value)), align="R")
        y += 5

    y = max(y, y_after_address) + 10
    pdf.set_xy(_RIGHT_COL_X, y)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(50, 9, "Delivery note")
    pdf.cell(40, 9, _latin1(order.delivery_note_number or ""), align="R")
    y += 11
    pdf.set_font("Helvetica", "B", 9)
    for label, value in [
        ("Please specify when making inquiries!", ""),
        (f"Page {pdf.page_no()} / {{nb}}", _issue_date(order)),
        ("Order no.", order.number),
    ]:
        pdf.set_xy(_RIGHT_COL_X, y)
        pdf.cell(60, 5, label)
        pdf.cell(30, 5, _latin1(value), align="R")
        y += 5

    # line items — quantities only, a delivery note carries no prices
    pos_w, product_w, qty_w = 12, 48, 30
    desc_w = _PAGE_W - pos_w - product_w - qty_w
    pdf.set_xy(_LEFT, y + 14)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(pos_w, 6, "Pos.")
    pdf.cell(product_w, 6, "Product")
    pdf.cell(desc_w, 6, "Description")
    pdf.cell(qty_w, 6, "Quantity", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.line(_LEFT, pdf.get_y(), _LEFT + _PAGE_W, pdf.get_y())
    pdf.ln(1)

    for idx, item in enumerate(order.items, start=1):
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(pos_w, 6, str(idx * 10))
        pdf.cell(product_w + desc_w, 6, _latin1(item.sku))
        pdf.cell(qty_w, 6, f"{item.qty} pcs", align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        pdf.set_x(_LEFT + pos_w)
        pdf.multi_cell(product_w + desc_w, 5, _latin1(item.name), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

    shipment = [
        ("HS Code", note.get("hs_code")),
        ("No. of packages", note.get("packages")),
        ("Size", note.get("size")),
        ("Weight", note.get("weight")),
    ]
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 9)
    for label, value in shipment:
        if value:
            pdf.cell(0, 4.5, _latin1(f"{label}: {value}"), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(28, 6, "Payment type:")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(
        0, 6,
        "Card payment (paid in advance)" if order.payment_method == "card" else "Bank transfer / invoice",
        new_x="LMARGIN", new_y="NEXT",
    )

    _draw_footer(pdf)
    return bytes(pdf.output())
