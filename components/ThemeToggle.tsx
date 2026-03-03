"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const shouldUseDark = savedTheme !== "light";

    if (shouldUseDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setIsDark(shouldUseDark);

    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-8 w-14 items-center rounded-full bg-zinc-200 p-1 transition-all duration-300 dark:bg-zinc-700"
    >
      <div
        className={`flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 dark:bg-zinc-900 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          // 🌙 Moon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 0111.21 3c0 .34.02.67.05 1A7 7 0 1019 18.95c.33.03.66.05 1 .05z" />
          </svg>
        ) : (
          // ☀ Sun
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 4.5V2m0 20v-2.5m7.07-12.07H22m-20 0h2.93M16.95 7.05l1.77-1.77M4.28 19.72l1.77-1.77m0-11.9L4.28 4.28m14.44 14.44l-1.77-1.77M12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
        )}
      </div>
    </button>
  );
}
