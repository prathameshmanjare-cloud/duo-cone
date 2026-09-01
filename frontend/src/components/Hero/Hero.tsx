import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Button } from "../Button/Button";
import { IconArrowRight } from "../Icon/Icon";
import styles from "./Hero.module.css";

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // scroll -> the ring turns like a real wheel (clockwise, left to right)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const spinZ = useSpring(useTransform(scrollYProgress, [0, 1], [0, 320]), {
    stiffness: 80,
    damping: 20,
    mass: 0.4,
  });

  // pointer parallax -> the ring leans toward the cursor like a physical object
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [16, -16]), {
    stiffness: 120,
    damping: 16,
  });
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-22, 22]), {
    stiffness: 120,
    damping: 16,
  });
  const glowX = useTransform(px, [-0.5, 0.5], ["36%", "64%"]);
  const glowY = useTransform(py, [-0.5, 0.5], ["34%", "62%"]);

  function onPointerMove(e: React.PointerEvent) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onPointerLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <section
      className={styles.hero}
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.scene}>
          {/* idle bob (CSS) */}
          <div className={styles.bob}>
            {/* pointer tilt (JS) */}
            <motion.div
              className={styles.tilt}
              style={
                reduce
                  ? undefined
                  : { rotateX: rotX, rotateY: rotY, transformPerspective: 1400 }
              }
            >
              <motion.img
                src="/hero-bg.svg"
                alt=""
                className={styles.bg}
                style={reduce ? undefined : { rotate: spinZ }}
              />
              <motion.span
                className={styles.specular}
                style={reduce ? undefined : { left: glowX, top: glowY }}
              />
            </motion.div>
          </div>
        </div>
        <div className={styles.vignette} />
      </div>

      <div className={styles.inner}>
        <h1 className={styles.reveal} style={{ animationDelay: "0.05s" }}>
          DUO CONE SEALS (DO &amp; DF)
        </h1>
        <p className={styles.reveal} style={{ animationDelay: "0.18s" }}>
          Our Mechanical Face Seal Series is designed for high-pressure use. Made from top-quality
          materials, these seals resist wear, abrasion, and extreme temperatures — ideal for demanding
          machinery like hydraulic systems and construction equipment.
        </p>
        <div className={`${styles.actions} ${styles.reveal}`} style={{ animationDelay: "0.3s" }}>
          <Link to="/shop">
            <Button variant="primary">
              See our products <IconArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/rfq">
            <Button variant="ghost" className={styles.ghostOnDark}>
              Start an RFQ
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
