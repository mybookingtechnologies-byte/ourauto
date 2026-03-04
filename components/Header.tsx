"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({ listings: 0, dealers: 0 });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const shouldUseDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", shouldUseDark);
    queueMicrotask(() => {
      setIsDark(shouldUseDark);
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) {
          setStats({ listings: 0, dealers: 0 });
          return;
        }

        const data = await response.json();
        const payload = data?.data || {};
        setStats({
          listings: Number(payload.listings) || 0,
          dealers: Number(payload.dealers) || 0,
        });
      } catch {
        setStats({ listings: 0, dealers: 0 });
      }
    };

    loadStats();
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <header className="w-full border-b border-zinc-200 bg-white/95 px-4 py-3 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-wide">OurAuto</span>
          <span className="text-sm text-zinc-400">
            {stats.listings} Live Listings • {stats.dealers} Verified Dealers
          </span>
        </div>

        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-base transition-colors hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700"
            aria-label="Toggle dark mode"
          >
            {isDark ? "☀" : "☾"}
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-md border border-zinc-300 p-2 transition-colors hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700"
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-32 rounded-md border border-zinc-200 bg-white py-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2 text-sm hover:text-[var(--primary-yellow)]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2 text-sm hover:text-[var(--primary-yellow)]"
              >
                Signup
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-2 text-sm hover:text-[var(--primary-yellow)]"
              >
                About
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}