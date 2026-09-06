import { create } from "zustand";
import { api, session, type SessionUser } from "../lib/api";

interface SessionState {
  user: SessionUser | null;
  status: "idle" | "loading" | "authed" | "anon";
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    full_name?: string;
    company_name?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  status: "idle",

  login: async (email, password) => {
    const tokens = await api.login(email, password);
    session.set(tokens.access_token);
    const user = await api.me();
    set({ user, status: "authed" });
  },

  register: async (payload) => {
    const tokens = await api.register(payload);
    session.set(tokens.access_token);
    const user = await api.me();
    set({ user, status: "authed" });
  },

  logout: () => {
    session.clear();
    set({ user: null, status: "anon" });
  },

  hydrate: async () => {
    if (!session.token) {
      set({ status: "anon" });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await api.me();
      set({ user, status: "authed" });
    } catch {
      session.clear();
      set({ user: null, status: "anon" });
    }
  },
}));
