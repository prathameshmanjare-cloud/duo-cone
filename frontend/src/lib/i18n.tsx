// English / German routing. The language is part of the URL (/de/...), so it
// is known on the server (prerender) and the client without any state.
import { forwardRef } from "react";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useLocation,
  type LinkProps,
  type NavLinkProps,
} from "react-router-dom";

export type Lang = "en" | "de";

// English path prefix <-> German path prefix. Pages not listed here (cart,
// checkout, account, legal pages, ...) exist in English only.
const PREFIXES: [en: string, de: string][] = [
  ["/product-category/", "/de/produktkategorie/"],
  ["/product/", "/de/produkt/"],
  ["/shop/", "/de/shop/"],
  ["/about-us/", "/de/ueber-uns/"],
  ["/technology/", "/de/technologie/"],
  ["/industries/", "/de/branchen/"],
  ["/contact/", "/de/kontakt/"],
  ["/faq/", "/de/faq/"],
  ["/rfq/", "/de/anfrage/"],
];

export const langOf = (pathname: string): Lang => (/^\/de(\/|$)/.test(pathname) ? "de" : "en");

function split(to: string) {
  const i = to.search(/[?#]/);
  return i < 0 ? [to, ""] : [to.slice(0, i), to.slice(i)];
}

/** The same page in the other language, or null when it has no German version. */
export function alternatePath(pathname: string, target: Lang): string | null {
  const [path, rest] = split(pathname);
  const p = path.endsWith("/") ? path : path + "/";
  const from = langOf(p);
  if (from === target) return path + rest;
  if (target === "de") {
    if (p === "/") return "/de/" + rest;
    const hit = PREFIXES.find(([en]) => p.startsWith(en));
    return hit ? hit[1] + p.slice(hit[0].length) + rest : null;
  }
  if (p === "/de/") return "/" + rest;
  const hit = PREFIXES.find(([, de]) => p.startsWith(de));
  return hit ? hit[0] + p.slice(hit[1].length) + rest : null;
}

/** Path for a link in `lang`: German where a German page exists, else as given. */
export const localize = (to: string, lang: Lang) =>
  lang === "de" && to.startsWith("/") ? alternatePath(to, "de") ?? to : to;

export function useLang(): Lang {
  return langOf(useLocation().pathname);
}

/** react-router Link that keeps the visitor in their language. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  const lang = useLang();
  return <RouterLink ref={ref} to={typeof to === "string" ? localize(to, lang) : to} {...rest} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, ...rest }, ref) {
  const lang = useLang();
  return <RouterNavLink ref={ref} to={typeof to === "string" ? localize(to, lang) : to} {...rest} />;
});

/** Pick the string for the current language: t({ en: "Shop", de: "Shop" }). */
export function useT() {
  const lang = useLang();
  return <T,>(s: { en: T; de: T }) => s[lang];
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Text-table translation for long pages: L("English text") gives the German
 *  entry of `dict` on German pages (keys with whitespace collapsed), else the
 *  English text. L.deep(data) translates every string inside a data list. */
export function useDict(dict: Record<string, string>) {
  const lang = useLang();
  const L = (en: string) => (lang === "de" ? dict[norm(en)] ?? en : en);
  const deep = <T,>(v: T): T => {
    if (lang !== "de") return v;
    if (typeof v === "string") return L(v) as T;
    if (Array.isArray(v)) return v.map(deep) as T;
    if (v && typeof v === "object")
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) as T;
    return v;
  };
  return Object.assign(L, { deep });
}
