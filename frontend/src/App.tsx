import { Routes, Route } from "react-router-dom";
import { RootLayout } from "./components/Layout/RootLayout";
import { Home } from "./routes/Home/Home";
import { Shop } from "./routes/Shop/Shop";
import { Category } from "./routes/Shop/Category";
import { Product } from "./routes/Product/Product";
import { Search } from "./routes/Search/Search";
import { CrossReference } from "./routes/CrossReference/CrossReference";
import { Rfq } from "./routes/Rfq/Rfq";
import { Cart } from "./routes/Cart/Cart";
import { Checkout } from "./routes/Checkout/Checkout";
import { OrderSuccess } from "./routes/OrderSuccess/OrderSuccess";
import { Login, Register, ForgotPassword, ResetPassword } from "./routes/Auth/AuthForm";
import {
  AccountLayout,
  AccountOverview,
  AccountOrders,
  AccountRfqs,
  AccountAddresses,
  AccountWishlist,
  AccountProfile,
} from "./routes/Account/Account";
import { About, Technology, Industries, Shipping, Returns, Privacy, Terms, CookiePolicy, LegalNotice } from "./routes/Content/pages";
import { Contact } from "./routes/Content/Contact";
import { Faq } from "./routes/Content/Faq";
import { NotFound } from "./routes/NotFound/NotFound";
import { AdminLayout } from "./routes/Admin/AdminLayout";
import { AdminLogin } from "./routes/Admin/AdminLogin";
import { Dashboard } from "./routes/Admin/Dashboard";
import { ProductsAdmin } from "./routes/Admin/ProductsAdmin";
import { ProductEdit } from "./routes/Admin/ProductEdit";
import { BrandsAdmin } from "./routes/Admin/BrandsAdmin";
import { CategoriesAdmin } from "./routes/Admin/CategoriesAdmin";
import { OrdersAdmin } from "./routes/Admin/OrdersAdmin";
import { RfqsAdmin } from "./routes/Admin/RfqsAdmin";
import { UsersAdmin } from "./routes/Admin/UsersAdmin";
import { AdminAccount } from "./routes/Admin/AdminAccount";
import { EmailSettingsAdmin } from "./routes/Admin/EmailSettingsAdmin";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cross-reference" element={<CrossReference />} />
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

        <Route path="/about" element={<About />} />
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
  );
}
