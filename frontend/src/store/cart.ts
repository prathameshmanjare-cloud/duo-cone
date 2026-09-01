import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductCard } from "../lib/api";

export interface CartLine {
  product: ProductCard;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  add: (product: ProductCard, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  subtotalCents: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      add: (product, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.product.id === product.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.product.id === product.id ? { ...l, qty: l.qty + qty } : l
              ),
              isOpen: true,
            };
          }
          return { lines: [...state.lines, { product, qty }], isOpen: true };
        }),
      remove: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) })),
      setQty: (productId, qty) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.product.id === productId ? { ...l, qty: Math.max(1, qty) } : l)),
        })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      subtotalCents: () =>
        get().lines.reduce((sum, l) => sum + (l.product.sale_price_cents ?? l.product.price_cents) * l.qty, 0),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
    }),
    { name: "duocone-cart" }
  )
);
