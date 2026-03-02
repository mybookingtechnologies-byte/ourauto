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
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Total Dealers: {totalDealers}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Pending: {pendingDealers}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Cars: {totalCars}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Revenue (mock): ₹0</div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/dealers" className="rounded-2xl bg-accent px-4 py-2 font-semibold text-black">Dealers</Link>
        <Link href="/admin/cars" className="rounded-2xl bg-bgSecondary px-4 py-2">Cars</Link>
        <Link href="/admin/subscriptions" className="rounded-2xl bg-bgSecondary px-4 py-2">Subscriptions</Link>
        <Link href="/admin/settings" className="rounded-2xl bg-bgSecondary px-4 py-2">Settings</Link>
      </div>
    </main>
  );
}
