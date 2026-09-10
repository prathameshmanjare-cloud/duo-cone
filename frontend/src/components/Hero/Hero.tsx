import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "../Button/Button";
import { IconArrowRight } from "../Icon/Icon";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

const TITLE = "DUO CONE SEALS";

function Img({
  cls,
  name,
  alt,
  cover,
}: {
  cls: string;
  name: string;
  alt: string;
  cover?: boolean;
}) {
  return (
    <img
      className={cls}
      src={`/${name}.webp`}
      srcSet={`/${name}-sm.webp 900w, /${name}.webp 1600w`}
      sizes={cover ? "100vw" : "(max-width: 700px) 92vw, 62vw"}
      alt={alt}
      loading="eager"
      decoding="async"
    />
  );
}

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 5,
        dur: 7 + Math.random() * 9,
      })),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce) return;

    const ctx = gsap.context(() => {
      const s = (n: string) => `.${styles[n as keyof typeof styles]}`;

      // headline split-char reveal (runs once on mount)
      gsap.from(s("char"), {
        yPercent: 130,
        opacity: 0,
        rotateX: -90,
        stagger: 0.035,
        duration: 0.9,
        ease: "power4.out",
        delay: 0.3,
      });

      const mid = { immediateRender: false };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => "+=" + (root.offsetHeight - window.innerHeight),
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });

      // --- ch1 -> ch2 : hero rotates away, exploded view flies in ---
      tl.to(s("layerHero"), { rotateY: -22, z: -160, autoAlpha: 0, ...mid }, 0.16)
        .fromTo(
          s("layerRot"),
          { autoAlpha: 0.25, xPercent: -6, scale: 0.94 },
          { autoAlpha: 0, xPercent: -14, scale: 0.9, ...mid },
          0.16,
        )
        .fromTo(
          s("layerExplode"),
          { autoAlpha: 0, scale: 1.14, filter: "blur(14px)", clipPath: "inset(0 40% 0 40%)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", clipPath: "inset(0 0% 0 0%)", ...mid },
          0.18,
        )
        .to(s("copyInner"), { yPercent: -40, autoAlpha: 0, ...mid }, 0.14)
        .fromTo(s("c2"), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ...mid }, 0.24)

        // --- ch2 hold : parts drift, glow shifts ---
        .to(s("layerExplode"), { scale: 1.08, xPercent: 4, ...mid }, 0.3)
        .to(s("glowA"), { xPercent: 18, scale: 1.4, ...mid }, 0.16)
        .to(s("glowB"), { xPercent: -16, yPercent: 10, scale: 1.25, ...mid }, 0.3)

        // --- ch2 -> ch3 : macro circle-wipe reveal ---
        .to(s("c2"), { autoAlpha: 0, y: -40, ...mid }, 0.5)
        .to(s("layerExplode"), { autoAlpha: 0, scale: 1.2, ...mid }, 0.52)
        .fromTo(
          s("layerMacro"),
          { autoAlpha: 1, clipPath: "circle(0% at 62% 46%)", scale: 1.15 },
          { autoAlpha: 1, clipPath: "circle(85% at 62% 46%)", scale: 1, ...mid },
          0.52,
        )
        .fromTo(s("c3"), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, ...mid }, 0.6)
        .fromTo(
          s("spec"),
          { autoAlpha: 0, y: 40, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", stagger: 0.12, ...mid },
          0.64,
        )

        // --- ch3 -> ch4 : macro dims, hero returns for the CTA ---
        .to(s("c3"), { autoAlpha: 0, y: -40, ...mid }, 0.82)
        .to(s("spec"), { autoAlpha: 0, y: -24, stagger: 0.08, ...mid }, 0.82)
        .to(s("layerMacro"), { autoAlpha: 0.14, scale: 1.08, ...mid }, 0.82)
        .fromTo(
          s("layerHero"),
          { autoAlpha: 0, rotateY: 18, z: -220, scale: 0.8 },
          { autoAlpha: 0.9, rotateY: 0, z: 0, scale: 0.82, ...mid },
          0.84,
        )
        .fromTo(s("c4"), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, ...mid }, 0.88)
        .fromTo(
          s("cta"),
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, stagger: 0.06, ...mid },
          0.92,
        );
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    const timers = [250, 900, 1800].map((t) => setTimeout(refresh, t));
    window.addEventListener("load", refresh);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [reduce]);

  return (
    <section className={styles.hero} ref={rootRef}>
      <div className={styles.sticky}>
        <div className={styles.bg} aria-hidden="true" />
        <div className={`${styles.glow} ${styles.glowA}`} aria-hidden="true" />
        <div className={`${styles.glow} ${styles.glowB}`} aria-hidden="true" />

        <div className={styles.particles} aria-hidden="true">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className={styles.particle}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={reduce ? {} : { y: [0, -34, 0], opacity: [0, 0.85, 0] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className={styles.stage} aria-hidden="true">
          <div className={`${styles.layer} ${styles.layerRot}`}>
            <Img cls={styles.layerImg} name="seal-rot" alt="" />
          </div>
          <div className={`${styles.layer} ${styles.layerMacro}`}>
            <Img cls={styles.layerImgCover} name="seal-macro" alt="" cover />
          </div>
          <div className={`${styles.layer} ${styles.layerExplode}`}>
            <Img cls={styles.layerImg} name="seal-explode" alt="" />
          </div>
          <div className={`${styles.layer} ${styles.layerHero}`}>
            <motion.div
              className={styles.heroFloat}
              initial={reduce ? false : { opacity: 0, scale: 1.25, filter: "blur(22px)" }}
              animate={
                reduce
                  ? {}
                  : { opacity: 1, scale: 1, filter: "blur(0px)", y: [0, -16, 0], rotate: [0, 1.2, 0] }
              }
              transition={{
                opacity: { duration: 1.3, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 1.2 },
                y: { duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.3 },
                rotate: { duration: 9.5, repeat: Infinity, ease: "easeInOut", delay: 1.3 },
              }}
            >
              <Img cls={styles.layerImg} name="hero-seal" alt="DUO CONE mechanical face seal, cutaway view" />
            </motion.div>
          </div>
        </div>

        <div className={styles.textScrim} aria-hidden="true" />

        {/* chapter copy */}
        <div className={styles.copy}>
          <div className={styles.copyInner}>
            <span className={styles.kicker}>DO &amp; DF Series · German-engineered</span>
            <h1 className={styles.title} aria-label={TITLE}>
              {TITLE.split("").map((c, i) => (
                <span key={i} className={styles.charWrap} aria-hidden="true">
                  <span className={styles.char}>{c === " " ? " " : c}</span>
                </span>
              ))}
            </h1>
            <p className={styles.sub}>
              High-pressure mechanical face seals built for the heaviest duty on earth.
            </p>
          </div>

          <h2 className={`${styles.chapter} ${styles.c2}`}>
            Four precision parts.<br />
            <span>Two steel rings, two toric O-rings.</span>
          </h2>

          <h2 className={`${styles.chapter} ${styles.c3}`}>
            Lapped faces,<br />
            <span>oil-film tight under 60+ bar.</span>
          </h2>

          <div className={`${styles.chapter} ${styles.c4}`}>
            <h2>DUO CONE SEALS (DO &amp; DF)</h2>
            <p>
              Resist wear, abrasion and extreme temperature in hydraulic systems and
              construction equipment.
            </p>
            <div className={styles.actions}>
              <Link to="/shop" className={styles.cta}>
                <Button variant="primary">
                  See our products <IconArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/rfq" className={styles.cta}>
                <Button variant="ghost" className={styles.ghostOnDark}>
                  Start an RFQ
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.specs} aria-hidden="true">
          <div className={styles.spec}>
            <b>60+ bar</b>
            <span>working pressure</span>
          </div>
          <div className={styles.spec}>
            <b>−40…220°C</b>
            <span>temperature range</span>
          </div>
          <div className={styles.spec}>
            <b>DIN EN ISO 9001</b>
            <span>manufactured</span>
          </div>
        </div>

        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.scrollCue} aria-hidden="true">
          <span>Scroll</span>
        </div>
      </div>
    </section>
  );
}
