import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/lib/adminPageAuth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();

  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] w-full max-w-7xl space-y-6 px-4 py-10">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Admin Panel</h1>
        <nav className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:text-[var(--primary-yellow)] dark:border-zinc-700 dark:text-zinc-200">
            Overview
          </Link>
          <Link href="/admin/dealers" className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:text-[var(--primary-yellow)] dark:border-zinc-700 dark:text-zinc-200">
            Dealers
          </Link>
          <Link href="/admin/listings" className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:text-[var(--primary-yellow)] dark:border-zinc-700 dark:text-zinc-200">
            Listings
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
