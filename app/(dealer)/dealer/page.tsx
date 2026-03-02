import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DealerDashboardPage(): Promise<JSX.Element> {
  const session = await getSessionUser();
  if (!session) {
    return <main className="p-6">Unauthorized</main>;
  }

  const [totalCars, activeCars, soldCars, wallet] = await Promise.all([
    prisma.car.count({ where: { dealerId: session.userId } }),
    prisma.car.count({ where: { dealerId: session.userId, status: "ACTIVE" } }),
    prisma.car.count({ where: { dealerId: session.userId, status: "SOLD" } }),
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
  ]);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Dealer Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Total Cars: {totalCars}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Active: {activeCars}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Sold: {soldCars}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Boost: {user?.boostRemaining || 0}</div>
        <div className="rounded-2xl bg-bgSecondary p-6 shadow-lg">Wallet: ₹{wallet?.balance.toString() || "0"}</div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dealer/add-car" className="rounded-2xl bg-accent px-4 py-2 font-semibold text-black">Add Car</Link>
        <Link href="/dealer/listings" className="rounded-2xl bg-bgSecondary px-4 py-2">Listings</Link>
        <Link href="/dealer/marketplace" className="rounded-2xl bg-bgSecondary px-4 py-2">Marketplace</Link>
        <Link href="/dealer/chat" className="rounded-2xl bg-bgSecondary px-4 py-2">Chat</Link>
        <Link href="/dealer/settings" className="rounded-2xl bg-bgSecondary px-4 py-2">Settings</Link>
      </div>
    </main>
  );
}
