import { useState } from "react";
import styles from "./WhatsAppButton.module.css";

const PHONE = "4915510386300";
const DEFAULT_MESSAGE = "Hi, I'd like to place an order for DuoCone seals.";

function waHref(text: string) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function send() {
    window.open(waHref(draft.trim() || DEFAULT_MESSAGE), "_blank", "noopener,noreferrer");
    setDraft("");
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Chat on WhatsApp">
          <div className={styles.head}>
            <WhatsAppIcon size={22} />
            <span className={styles.headTitle}>Let's chat on WhatsApp</span>
          </div>

          <div className={styles.body}>
            <div className={styles.bubbleRow}>
              <span className={styles.avatar}>DC</span>
              <div className={styles.bubble}>
                <div className={styles.bubbleName}>DuoCone</div>
                <div className={styles.bubbleText}>How can we help you? :)</div>
                <div className={styles.bubbleTime}>
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className={styles.input}
              placeholder="Write your message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.sendBtn} aria-label="Send on WhatsApp">
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close WhatsApp chat" : "Chat on WhatsApp"}
      >
        {open ? <CloseIcon /> : <WhatsAppIcon size={30} />}
      </button>
    </>
  );
}

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.892.522 3.717 1.51 5.32L2 22l4.83-1.487A9.96 9.96 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.09c-1.656 0-3.276-.446-4.687-1.29l-.336-.2-3.223.992.985-3.235-.219-.336A8.09 8.09 0 0 1 3.91 12c0-4.464 3.63-8.09 8.09-8.09 4.464 0 8.09 3.626 8.09 8.09 0 4.464-3.626 8.09-8.09 8.09z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  );
}
