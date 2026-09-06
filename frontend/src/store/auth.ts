import { create } from "zustand";
import { adminApi, tokenStore, type AdminUser } from "../lib/adminApi";

interface AuthState {
  user: AdminUser | null;
  status: "idle" | "loading" | "authed" | "anon";
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  login: async (email, password, remember = true) => {
    const tokens = await adminApi.login(email, password);
    tokenStore.set(tokens.access_token, tokens.refresh_token, remember);
    const user = await adminApi.me();
    if (!user.is_admin) {
      tokenStore.clear();
      throw new Error("This account does not have admin access.");
    }
    set({ user, status: "authed" });
  },

  logout: () => {
    tokenStore.clear();
    set({ user: null, status: "anon" });
  },

  hydrate: async () => {
    if (!tokenStore.access) {
      set({ status: "anon" });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await adminApi.me();
      set({ user, status: user.is_admin ? "authed" : "anon" });
      if (!user.is_admin) tokenStore.clear();
    } catch {
      tokenStore.clear();
      set({ user: null, status: "anon" });
    }
  },
}));
