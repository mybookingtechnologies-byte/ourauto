import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const [totalDealers, pendingDealers, totalCars] = await Promise.all([
    prisma.user.count({ where: { role: "DEALER" } }),
    prisma.user.count({ where: { role: "DEALER", status: "PENDING" } }),
    prisma.car.count(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Total Dealers: {totalDealers}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Pending: {pendingDealers}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Cars: {totalCars}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Revenue (mock): ₹0</div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/dealers" className="rounded-2xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-600">Dealers</Link>
        <Link href="/admin/cars" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Cars</Link>
        <Link href="/admin/subscriptions" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Subscriptions</Link>
        <Link href="/admin/settings" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Settings</Link>
      </div>
    </main>
  );
}
