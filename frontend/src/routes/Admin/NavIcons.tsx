import type React from "react";

// Small stroke-based icon set for the admin sidebar — replaces emoji
// (renders inconsistently across OS/fonts) with crisp, theme-consistent
// SVGs that inherit currentColor from the nav link's text color.

export type NavIconName =
  | "dashboard"
  | "box"
  | "tag"
  | "folder"
  | "receipt"
  | "mail"
  | "users"
  | "settings"
  | "key";

const PATHS: Record<NavIconName, React.ReactElement> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  box: (
    <>
      <path d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5Z" />
      <path d="M3.5 7.5V16l8.5 4.5V12" />
      <path d="M20.5 7.5V16L12 20.5" />
    </>
  ),
  tag: (
    <>
      <path d="M12.5 3H4v8.5L14 21l8.5-8.5L12.5 3Z" />
      <circle cx="8.2" cy="8.2" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  folder: <path d="M3 6a1.5 1.5 0 0 1 1.5-1.5h4.4l2 2H19.5A1.5 1.5 0 0 1 21 8v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6Z" />,
  receipt: (
    <>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 6.5 8 6 8-6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17.5" cy="9" r="2.6" />
      <path d="M15.2 12.2A4.6 4.6 0 0 1 20.5 20" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.8a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56v.16a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 5.65 7.7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 11.13 2h.16a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08c.18.64.75 1.1 1.42 1.13H20a2 2 0 1 1 0 4h-.09c-.67.03-1.24.49-1.42 1.13Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M11 12.5 20 3.5" />
      <path d="m17 6.5 2.5 2.5M14 9.5l2 2" />
    </>
  ),
};

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return (
    <svg
      className={className}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
