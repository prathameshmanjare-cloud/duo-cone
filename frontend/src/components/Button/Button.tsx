import type { ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./Button.module.css";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd"
>;

type ButtonProps = NativeButtonProps & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      className={`${styles.btn} ${styles[variant]} ${className}`}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...rest}
    />
  );
}
