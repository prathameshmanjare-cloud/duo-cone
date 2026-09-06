import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ChatBotProduct } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import styles from "./ChatWidget.module.css";

interface Msg {
  role: "user" | "bot";
  text: string;
  quick_replies?: string[];
  products?: ChatBotProduct[];
}

const GREETING: Msg = {
  role: "bot",
  text:
    "Hi! I'm the DuoCone assistant. Ask about a seal, a part number, shipping or pricing — or I can connect you with sales.",
  quick_replies: ["Find a seal by part number", "Shipping & delivery", "Request a quote", "Talk to sales"],
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, handoff, open]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.chat(clean, history);
      setMessages((m) => [
        ...m,
        { role: "bot", text: res.reply, quick_replies: res.quick_replies, products: res.products },
      ]);
      if (res.handoff) setHandoff(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Sorry, I couldn't reach the server. Try again or email sales@duo-cone.com." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button className={styles.launcher} onClick={() => setOpen(true)} aria-label="Open chat">
          <ChatIcon /> Chat with us
        </button>
      )}

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Support chat">
          <div className={styles.head}>
            <div>
              <div className={styles.headTitle}>DuoCone assistant</div>
              <div className={styles.headSub}>Typically replies instantly</div>
            </div>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>

          <div className={styles.body} ref={bodyRef}>
            {messages.map((m, i) => (
              <MsgView key={i} msg={m} onChip={send} last={i === messages.length - 1} />
            ))}
            {busy && <div className={`${styles.msg} ${styles.bot}`}>…</div>}
          </div>

          {handoff ? (
            <HandoffForm onClose={() => setHandoff(false)} />
          ) : (
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className={styles.row}>
                <input
                  className={styles.input}
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoFocus
                />
                <button className={styles.send} type="submit" disabled={busy || !input.trim()}>
                  Send
                </button>
              </div>
              <button type="button" className={styles.linkish} onClick={() => setHandoff(true)}>
                Leave a message for sales
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function MsgView({ msg, onChip, last }: { msg: Msg; onChip: (t: string) => void; last: boolean }) {
  return (
    <>
      <div className={`${styles.msg} ${msg.role === "user" ? styles.user : styles.bot}`}>{msg.text}</div>
      {msg.products && msg.products.length > 0 && (
        <div className={styles.cards}>
          {msg.products.map((p) => (
            <Link key={p.slug} to={`/product/${p.slug}`} className={styles.pcard}>
              <div className={styles.pcardName}>{p.name}</div>
              <div className={styles.pcardMeta}>
                {p.sku} ·{" "}
                {p.is_rfq_only ? "Price on request" : formatPrice(p.price_cents, p.currency)}
              </div>
            </Link>
          ))}
        </div>
      )}
      {last && msg.role === "bot" && msg.quick_replies && msg.quick_replies.length > 0 && (
        <div className={styles.chips}>
          {msg.quick_replies.map((q) => (
            <button key={q} className={styles.chip} onClick={() => onChip(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function HandoffForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await api.chatHandoff({ email, message, name: name || undefined });
      setDone(res.number);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className={styles.handoff}>
        <p className={styles.ok}>Thanks — sent. Reference {done}. Sales will email you shortly.</p>
        <button type="button" className={styles.linkish} onClick={onClose}>
          Back to chat
        </button>
      </div>
    );
  }

  return (
    <form className={styles.handoff} onSubmit={submit}>
      <h4>Leave a message for sales</h4>
      <input
        className={styles.input}
        type="text"
        placeholder="Your name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={styles.input}
        type="email"
        placeholder="Email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        placeholder="How can we help? Include part numbers if you have them."
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {err && <p className={styles.err}>{err}</p>}
      <div className={styles.row}>
        <button className={styles.send} type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send to sales"}
        </button>
        <button type="button" className={styles.linkish} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}
