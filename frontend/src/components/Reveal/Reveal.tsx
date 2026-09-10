import type { ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type Variants,
  type Transition,
} from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  as?: "div" | "section" | "ul" | "li" | "article";
  /** seconds */
  delay?: number;
  /** px travel */
  y?: number;
  /** viewport visibility fraction that triggers the reveal */
  amount?: number;
  once?: boolean;
  className?: string;
};

/**
 * Scroll-into-view reveal. framer-motion `whileInView`; fades + rises, with a
 * light blur wipe. Honours prefers-reduced-motion (renders static).
 */
export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 24,
  amount = 0.2,
  once = true,
  className = "",
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    return <MotionTag className={className}>{children}</MotionTag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: 0.65, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE } as Transition,
  },
};

/** Wrap a list/grid; direct <RevealItem> children animate in sequence. */
export function RevealGroup({
  children,
  as = "div",
  amount = 0.15,
  once = true,
  className = "",
}: Omit<RevealProps, "delay" | "y">) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) return <MotionTag className={className}>{children}</MotionTag>;

  return (
    <MotionTag
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  as = "div",
  className = "",
}: {
  children: ReactNode;
  as?: "div" | "li" | "article";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];
  if (reduce) return <MotionTag className={className}>{children}</MotionTag>;
  return (
    <MotionTag className={className} variants={itemVariants}>
      {children}
    </MotionTag>
  );
}
