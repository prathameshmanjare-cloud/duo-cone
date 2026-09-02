import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { IconArrowRight } from "../../components/Icon/Icon";
import heavyImg from "../../assets/industries/heavy.jpg";
import productImg from "../../assets/product/do-cut.png";
import styles from "./About.module.css";

const PARAGRAPHS = [
  "We offer a wide range of Mechanical Face Seals in various sizes – available at short notice, at competitive prices, and backed by top-level service.",
  "Thanks to our warehouse located in Germany, we are able to immediately deliver all types of mechanical seals. This enables us to respond quickly and efficiently to customer needs across Europe – and beyond.",
  "We aim to meet every single inquiry for Mechanical Face Seals throughout Europe and worldwide. Our consistent quality makes us a reliable and competitive player in the sealing industry.",
  "Let our service impress you. Get in touch today or place your order now – we're ready to deliver, wherever you are.",
];

function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h13v13H1zM14 8h4l3 3v5h-7" />
      <circle cx="5.5" cy="18.5" r="2" />
      <circle cx="17.5" cy="18.5" r="2" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h7.9a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}
function IconHeadset() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
      <path d="M20 15a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2zM4 15a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2z" />
      <path d="M20 15v2a4 4 0 0 1-4 4h-3" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

const VALUES = [
  { k: "Short notice", v: "Ships in 72h from our German warehouse", icon: <IconTruck /> },
  { k: "Competitive pricing", v: "Fair prices across the full size range", icon: <IconTag /> },
  { k: "Top-level service", v: "RFQ answered within 24 hours", icon: <IconHeadset /> },
  { k: "EU & worldwide", v: "Delivery across Europe and beyond", icon: <IconGlobe /> },
];

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <Helmet>
        <title>About Us | DuoCon</title>
        <meta
          name="description"
          content="DuoCon — German manufacturer for mechanical face seals. A wide range of sizes, short delivery times, competitive prices and top-level service across Europe and worldwide."
        />
      </Helmet>

      <div className={`${styles.hero} ${shown ? styles.in : ""}`}>
        <div className={styles.copy}>
          <span className={styles.kicker}>About Us</span>
          <h1>
            German manufacturer for <span>mechanical face seals</span>.
          </h1>
          {PARAGRAPHS.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <div className={styles.actions}>
            <Link to="/shop">
              <Button variant="primary">
                See our products <IconArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/technology">
              <Button variant="ghost">About technology</Button>
            </Link>
          </div>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <figure className={styles.photo}>
            <img src={heavyImg} alt="" loading="lazy" />
          </figure>

          <figure className={styles.blueprint}>
            <span className={styles.bpGrid} />
            <span className={styles.bpRing} />
            <img src={productImg} alt="" className={styles.bpProduct} loading="lazy" />
            <span className={styles.bpTag}>DUO CONE · DF / DO TYPE</span>
          </figure>

          <span className={styles.badge}>
            <b>Made in</b>
            <span className={styles.flag} />
            <b>Germany</b>
          </span>
        </div>
      </div>

      <div className={`${styles.values} ${shown ? styles.in : ""}`}>
        {VALUES.map((it, i) => (
          <div key={it.k} className={styles.value} style={{ transitionDelay: `${0.15 + i * 0.08}s` }}>
            <span className={styles.valueBar} aria-hidden="true" />
            <div className={styles.valueTop}>
              <span className={styles.valueIcon} aria-hidden="true">{it.icon}</span>
              <span className={styles.valueNum}>{String(i + 1).padStart(2, "0")}</span>
            </div>
            <strong>{it.k}</strong>
            <span>{it.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
