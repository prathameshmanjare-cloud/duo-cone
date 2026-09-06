import { useLocation, useNavigate } from "react-router-dom";
import type { ProductCard } from "./api";
import { useCartStore } from "../store/cart";
import { useSession } from "../store/session";

/**
 * Adds to the cart only when a customer is signed in; otherwise sends them to
 * the login page with a `next` back to the current route. Returns `true` when
 * the item was actually added.
 */
export function useGuardedCart() {
  const add = useCartStore((s) => s.add);
  const status = useSession((s) => s.status);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  return (product: ProductCard, qty = 1): boolean => {
    if (status !== "authed") {
      navigate(`/login?next=${encodeURIComponent(pathname + search)}`);
      return false;
    }
    add(product, qty);
    return true;
  };
}
