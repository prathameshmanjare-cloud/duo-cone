import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { CartDrawer } from "../CartDrawer/CartDrawer";
import { ChatWidget } from "../ChatWidget/ChatWidget";
import { CtaBanner } from "../CtaBanner/CtaBanner";
import { useSession } from "../../store/session";
import styles from "./RootLayout.module.css";

export function RootLayout() {
  const location = useLocation();
  const authed = useSession((s) => s.status === "authed");
  // full contact section already lives on /contact; skip the banner there
  const hideCta = location.pathname === "/contact";

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
      {!hideCta && <CtaBanner />}
      <Footer />
      {authed && <CartDrawer />}
      <ChatWidget />
    </>
  );
}
