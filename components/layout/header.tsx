"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { Button } from "@/components/ui/button";

type SessionRole = "DEALER" | "ADMIN" | null;

export function Header(): JSX.Element {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<SessionRole>(null);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [dealerName, setDealerName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function handleItemClick(): void {
    setIsOpen(false);
  }

  useEffect(() => {
    let mounted = true;

    async function detectRole(): Promise<void> {
      const dealerResponse = await fetch("/api/dealer/profile", { cache: "no-store" });
      if (!mounted) return;
      if (dealerResponse.ok) {
        const data = (await dealerResponse.json()) as {
          user?: { id?: string | null; dealerName?: string | null; profileImage?: string | null };
        };
        setRole("DEALER");
        setDealerId(data.user?.id || null);
        setDealerName(data.user?.dealerName || "Dealer");
        setAvatarUrl(data.user?.profileImage || null);
        return;
      }

      const adminResponse = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!mounted) return;
      if (adminResponse.ok) {
        setRole("ADMIN");
        setDealerId(null);
        setDealerName("Admin");
        setAvatarUrl(null);
        return;
      }

      setRole(null);
      setDealerId(null);
      setDealerName("");
      setAvatarUrl(null);
    }

    void detectRole();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const isLoggedIn = role !== null;
  const initials =
    dealerName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";

  const navLinks: Array<{ href: string; label: string }> =
    role === "ADMIN"
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/dealers", label: "Dealers" },
          { href: "/about", label: "About Us" },
        ]
      : role === "DEALER"
        ? [
            { href: "/dealer", label: "Dashboard" },
            { href: "/dealer/listings", label: "My Listings" },
            { href: "/dealer/marketplace", label: "Marketplace" },
            { href: "/about", label: "About Us" },
          ]
        : [
            { href: "/login", label: "Login" },
            { href: "/dealer-signup", label: "Dealer Signup" },
            { href: "/about", label: "About Us" },
          ];

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-black sm:px-6">
      <Link href="/" className="text-xl font-semibold text-black dark:text-white">
        Marketplace
      </Link>

      <div className="relative flex items-center gap-3" ref={menuRef}>
        <ThemeToggle />

        {isLoggedIn ? (
          <button
            type="button"
            aria-label="Open profile menu"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-10 w-10 overflow-hidden rounded-full border border-gray-300 transition hover:border-gray-500 dark:border-gray-700 dark:hover:border-gray-500"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center bg-zinc-900 text-sm font-semibold text-white">{initials}</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-lg p-2 transition hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5 text-black dark:text-white" />
          </button>
        )}

        {isOpen ? (
          <div className="animate-fade-in absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-black">
            {isLoggedIn ? (
              <>
                <Link
                  href={role === "DEALER" && dealerId ? `/dealer/${dealerId}` : "/admin"}
                  onClick={handleItemClick}
                  className="block px-4 py-2 text-sm text-black transition hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                >
                  My Profile
                </Link>
                <Link
                  href={role === "DEALER" ? "/dealer/settings" : "/admin/settings"}
                  onClick={handleItemClick}
                  className="block px-4 py-2 text-sm text-black transition hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                >
                  Settings
                </Link>

              <div className="border-t border-gray-200 p-2 dark:border-gray-800">
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={loggingOut}
                  onClick={() => {
                    setLoggingOut(true);
                    window.location.href = "/logout";
                  }}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </Button>
              </div>
              </>
            ) : (
              navLinks.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleItemClick}
                    className={`block px-4 py-2 text-sm transition ${
                      active
                        ? "bg-accent/20 font-semibold text-black dark:text-white"
                        : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
