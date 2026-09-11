import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import s from "./Admin.module.css";
import { usePrefersReducedMotion } from "./motionPrefs";

/** Framer-motion confirm dialog for destructive actions (delete product, etc).
 * Mirrors PasswordModal's layout/portal pattern so it looks consistent with
 * the rest of the admin CMS's modals. */
export function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  busy,
  error,
  danger = true,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={s.modalWrap}
        onMouseDown={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.15 }}
      >
        <motion.div
          className={s.modal}
          onMouseDown={(e) => e.stopPropagation()}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>{title}</h2>
          <p className={s.sub}>{message}</p>

          {error && <p className={s.error}>{error}</p>}

          <div className={s.modalActions}>
            <motion.button
              type="button"
              className={`${s.btn} ${s.btnGhost}`}
              onClick={onClose}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              className={`${s.btn} ${danger ? s.btnDanger : ""}`}
              disabled={busy}
              onClick={onConfirm}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              {busy ? "Working…" : confirmLabel}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
