import { Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { Outlet, useLocation } from "react-router-dom";
import { organizationJsonLd, websiteJsonLd } from "../../lib/seo";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import { CartDrawer } from "../CartDrawer/CartDrawer";
import { ChatWidget } from "../ChatWidget/ChatWidget";
import { WhatsAppButton } from "../WhatsAppButton/WhatsAppButton";
import { CtaBanner } from "../CtaBanner/CtaBanner";
import { CookieConsent } from "../CookieConsent/CookieConsent";
import { ScrollProgress } from "../ScrollProgress/ScrollProgress";
import { PageTransition } from "../PageTransition/PageTransition";
import styles from "./RootLayout.module.css";

export function RootLayout() {
  const location = useLocation();
  // these pages carry their own closing contact/CTA section
  const path = location.pathname.replace(/\/+$/, "");
  const hideCta = path === "/contact" || path === "/about-us";

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      </Helmet>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollProgress />
      <Header />
      <main id="main">
        <PageTransition>
          <div className={styles.page}>
            {/* on-demand pages load here; header and footer stay put */}
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </div>
        </PageTransition>
      </main>
      {!hideCta && <CtaBanner />}
      <Footer />
      <CartDrawer />
      <ChatWidget />
      <WhatsAppButton />
      <CookieConsent />
    </>
  );
}
