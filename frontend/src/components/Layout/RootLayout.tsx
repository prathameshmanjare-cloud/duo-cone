import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { CartDrawer } from "../CartDrawer/CartDrawer";
import styles from "./RootLayout.module.css";

export function RootLayout() {
  const location = useLocation();

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        {/* key remount re-triggers the CSS enter animation on route change */}
        <div key={location.pathname} className={styles.page}>
          <Outlet />
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
