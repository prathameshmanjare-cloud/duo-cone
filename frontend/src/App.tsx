import { Suspense, lazy, type ComponentType } from "react";
import { Routes, Route } from "react-router-dom";
import { RootLayout } from "./components/Layout/RootLayout";
import { Home } from "./routes/Home/Home";
import { Shop } from "./routes/Shop/Shop";
import { Category } from "./routes/Shop/Category";
import { Product } from "./routes/Product/Product";
import { Rfq } from "./routes/Rfq/Rfq";
import { About, Technology, Industries, Shipping, Returns, Privacy, Terms, CookiePolicy, LegalNotice } from "./routes/Content/pages";
import { Contact } from "./routes/Content/Contact";
import { Faq } from "./routes/Content/Faq";
import { NotFound } from "./routes/NotFound/NotFound";

// pages that are never prerendered (cart, checkout, account, admin, ...)
// load on demand, keeping them out of the bundle every visitor downloads
const page = <M,>(load: () => Promise<M>, name: keyof M) =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));
const Search = page(() => import("./routes/Search/Search"), "Search");
const Cart = page(() => import("./routes/Cart/Cart"), "Cart");
const Checkout = page(() => import("./routes/Checkout/Checkout"), "Checkout");
const OrderSuccess = page(() => import("./routes/OrderSuccess/OrderSuccess"), "OrderSuccess");
const Login = page(() => import("./routes/Auth/AuthForm"), "Login");
const Register = page(() => import("./routes/Auth/AuthForm"), "Register");
const ForgotPassword = page(() => import("./routes/Auth/AuthForm"), "ForgotPassword");
const ResetPassword = page(() => import("./routes/Auth/AuthForm"), "ResetPassword");
const AccountLayout = page(() => import("./routes/Account/Account"), "AccountLayout");
const AccountOverview = page(() => import("./routes/Account/Account"), "AccountOverview");
const AccountOrders = page(() => import("./routes/Account/Account"), "AccountOrders");
const AccountRfqs = page(() => import("./routes/Account/Account"), "AccountRfqs");
const AccountAddresses = page(() => import("./routes/Account/Account"), "AccountAddresses");
const AccountWishlist = page(() => import("./routes/Account/Account"), "AccountWishlist");
const AccountProfile = page(() => import("./routes/Account/Account"), "AccountProfile");
const AdminLayout = page(() => import("./routes/Admin/AdminLayout"), "AdminLayout");
const AdminLogin = page(() => import("./routes/Admin/AdminLogin"), "AdminLogin");
const Dashboard = page(() => import("./routes/Admin/Dashboard"), "Dashboard");
const ProductsAdmin = page(() => import("./routes/Admin/ProductsAdmin"), "ProductsAdmin");
const ProductEdit = page(() => import("./routes/Admin/ProductEdit"), "ProductEdit");
const BrandsAdmin = page(() => import("./routes/Admin/BrandsAdmin"), "BrandsAdmin");
const CategoriesAdmin = page(() => import("./routes/Admin/CategoriesAdmin"), "CategoriesAdmin");
const OrdersAdmin = page(() => import("./routes/Admin/OrdersAdmin"), "OrdersAdmin");
const RfqsAdmin = page(() => import("./routes/Admin/RfqsAdmin"), "RfqsAdmin");
const UsersAdmin = page(() => import("./routes/Admin/UsersAdmin"), "UsersAdmin");
const AdminAccount = page(() => import("./routes/Admin/AdminAccount"), "AdminAccount");
const EmailSettingsAdmin = page(() => import("./routes/Admin/EmailSettingsAdmin"), "EmailSettingsAdmin");

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/page/:page" element={<Shop />} />
          <Route path="/product-category/:segment" element={<Category />} />
          <Route path="/product-category/:segment/page/:page" element={<Category />} />
          <Route path="/product-category/:segment/:brand" element={<Category />} />
          <Route path="/product-category/:segment/:brand/page/:page" element={<Category />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/search" element={<Search />} />
          <Route path="/rfq" element={<Rfq />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="rfqs" element={<AccountRfqs />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="profile" element={<AccountProfile />} />
          </Route>

          <Route path="/about-us" element={<About />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/legal-notice" element={<LegalNotice />} />

          {/* German pages: same components, language taken from the URL (lib/i18n) */}
          <Route path="/de" element={<Home />} />
          <Route path="/de/shop" element={<Shop />} />
          <Route path="/de/shop/page/:page" element={<Shop />} />
          <Route path="/de/produktkategorie/:segment" element={<Category />} />
          <Route path="/de/produktkategorie/:segment/page/:page" element={<Category />} />
          <Route path="/de/produktkategorie/:segment/:brand" element={<Category />} />
          <Route path="/de/produktkategorie/:segment/:brand/page/:page" element={<Category />} />
          <Route path="/de/produkt/:slug" element={<Product />} />
          <Route path="/de/ueber-uns" element={<About />} />
          <Route path="/de/technologie" element={<Technology />} />
          <Route path="/de/branchen" element={<Industries />} />
          <Route path="/de/kontakt" element={<Contact />} />
          <Route path="/de/faq" element={<Faq />} />
          <Route path="/de/anfrage" element={<Rfq />} />
          <Route path="/de/versand" element={<Shipping />} />
          <Route path="/de/rueckgabe" element={<Returns />} />

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="products/new" element={<ProductEdit />} />
          <Route path="products/:id" element={<ProductEdit />} />
          <Route path="brands" element={<BrandsAdmin />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="rfqs" element={<RfqsAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="settings/email" element={<EmailSettingsAdmin />} />
          <Route path="account" element={<AdminAccount />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
