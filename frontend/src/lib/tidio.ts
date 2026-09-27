const TIDIO_KEY = import.meta.env.VITE_TIDIO_PUBLIC_KEY as string | undefined;

interface TidioChatApi {
  open: () => void;
  show: () => void;
  hide: () => void;
  on: (event: string, cb: () => void) => void;
  setVisitorData: (data: { email?: string; name?: string; phone?: string }) => void;
}

declare global {
  interface Window {
    tidioChatApi?: TidioChatApi;
  }
}

export const tidioEnabled = Boolean(TIDIO_KEY);

let ready: Promise<TidioChatApi> | null = null;

// Loads the Tidio script only when the visitor first clicks "Chat with us",
// so no third-party chat cookies are set for visitors who never open chat.
// Tidio's own bubble is kept hidden; our launcher button opens it instead.
function load(): Promise<TidioChatApi> {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    document.addEventListener(
      "tidioChat-ready",
      () => {
        const api = window.tidioChatApi!;
        api.on("close", () => api.hide());
        resolve(api);
      },
      { once: true },
    );
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://code.tidio.co/${TIDIO_KEY}.js`;
    script.onerror = () => {
      ready = null;
      reject(new Error("Tidio failed to load"));
    };
    document.body.appendChild(script);
  });
  return ready;
}

export async function openTidio(visitor?: { email?: string; name?: string; phone?: string }) {
  const api = await load();
  if (visitor?.email) api.setVisitorData(visitor);
  api.show();
  api.open();
}
