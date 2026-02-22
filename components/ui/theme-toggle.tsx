
"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 dark:border-white/15 transition-colors hover:border-accent"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12 4.75a.75.75 0 0 1 .75.75V7a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 12.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm7.25-5a.75.75 0 0 1-.75.75H17a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm-12.25 0a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Zm9.28 5.03a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06Zm-9.56-9.56a.75.75 0 1 1 1.06 1.06L6.72 9.58a.75.75 0 0 1-1.06-1.06l1.06-1.06Zm10.62 2.12a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06Zm-9.56 9.56a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 1.06L8.78 19.14ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12.4 3.05a.75.75 0 0 1 .65.9A7.25 7.25 0 1 0 20.05 11a.75.75 0 0 1 .9-.65.75.75 0 0 1 .6.8A8.75 8.75 0 1 1 11.6 2.45a.75.75 0 0 1 .8.6Z" />
        </svg>
      )}
    </button>
  );
}