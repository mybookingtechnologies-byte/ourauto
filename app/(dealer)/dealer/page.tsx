import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPlatformConfig } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DealerDashboardPage(): Promise<JSX.Element> {
  const session = await getSessionUser();
  if (!session) {
    return <main className="p-6">Unauthorized</main>;
  }

  const [totalCars, activeCars, soldCars, wallet, user, platformConfig] = await Promise.all([
    prisma.car.count({ where: { dealerId: session.userId } }),
    prisma.car.count({ where: { dealerId: session.userId, status: "ACTIVE" } }),
    prisma.car.count({ where: { dealerId: session.userId, status: "SOLD" } }),
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        status: true,
        hotDealCredits: true,
        futureAdCredits: true,
        totalListings: true,
      },
    }),
    getPlatformConfig(),
  ]);

  const statusLabel =
    user?.status === "APPROVED"
      ? "Approved"
      : user?.status === "REJECTED"
        ? "Rejected"
        : "Approval Pending";

  const statusClass =
    user?.status === "APPROVED"
      ? "bg-green-500/20 text-green-400"
      : user?.status === "REJECTED"
        ? "bg-red-500/20 text-red-400"
        : "bg-yellow-500/20 text-yellow-400";

  const milestone = platformConfig.hotDealMilestone;
  const currentProgress = (user?.totalListings ?? 0) % milestone;
  const listingsAway = currentProgress === 0 ? milestone : milestone - currentProgress;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dealer Dashboard</h1>
        <Badge className={statusClass}>{statusLabel}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Total Cars: {totalCars}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Active: {activeCars}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Sold: {soldCars}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Hot Deal Credits: {user?.hotDealCredits ?? 0}</div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">Future Ad Credits: {user?.futureAdCredits ?? 0}</div>
      </div>
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        Total Listings: {user?.totalListings ?? 0} • You are {listingsAway} listings away from next Hot Deal.
      </div>
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">Wallet: ₹{wallet?.balance.toString() || "0"}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dealer/add-car" className="rounded-2xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-600">Add Car</Link>
        <Link href="/dealer/listings" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Listings</Link>
        <Link href="/dealer/marketplace" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Marketplace</Link>
        <Link href="/dealer/chat" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Chat</Link>
        <Link href="/dealer/settings" className="rounded-2xl bg-zinc-200 px-4 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Settings</Link>
      </div>
    </main>
  );
}
