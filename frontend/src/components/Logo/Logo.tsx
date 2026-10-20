import logoUrl from "/logo.png";

// intrinsic size of public/logo.png
const RATIO = 93 / 32;

export function Logo({ height = 30, tone = "dark" }: { height?: number; tone?: "dark" | "light" }) {
  return (
    <img
      src={logoUrl}
      alt="DUO-CONE"
      width={Math.round(height * RATIO)}
      height={height}
      // light tone is the footer copy, far below the fold
      loading={tone === "light" ? "lazy" : undefined}
      style={{
        height,
        width: "auto",
        // brand mark is dark navy — flip to white on dark surfaces (footer)
        filter: tone === "light" ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}
