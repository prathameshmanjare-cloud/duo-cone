// Prerendered pages ship real HTML. Enter animations that start at opacity 0
// would hide that HTML until JavaScript runs (and make the server and client
// markup differ), so they are skipped while rendering on the server and
// during the first client render that hydrates the prerendered markup.
let hydrating =
  typeof document === "undefined" || Boolean(document.getElementById("root")?.hasChildNodes());

export const isHydrating = () => hydrating;

export function markHydrated() {
  hydrating = false;
}
