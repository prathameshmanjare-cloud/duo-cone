import logoUrl from "/logo.png";

export function Logo({ height = 30, tone = "dark" }: { height?: number; tone?: "dark" | "light" }) {
  return (
    <img
      src={logoUrl}
      alt="DUO-CONE"
      height={height}
      style={{
        height,
        width: "auto",
        // brand mark is dark navy — flip to white on dark surfaces (footer)
        filter: tone === "light" ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}
