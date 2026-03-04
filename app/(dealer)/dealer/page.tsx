import Link from "next/link";
import type { Metadata } from "next";
import { DealerAnalytics } from "@/components/dealer/DealerAnalytics";
import { Badge } from "@/components/ui/badge";
import { getPlatformConfig } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dealer Marketplace | OurAuto",
  description: "Verified B2B used car marketplace for professional dealers.",
  openGraph: {
    title: "Dealer Marketplace | OurAuto",
    description: "India’s trusted dealer-only wholesale car network.",
    url: "https://ourauto.in",
    siteName: "OurAuto",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function DealerDashboardPage(): Promise<JSX.Element> {
  const session = await getSessionUser();
  if (!session) {
    return <main className="p-6">Unauthorized</main>;
  }

  const [totalCars, activeCars, soldCars, totalInquiries, wallet, user, platformConfig] = await Promise.all([
    prisma.car.count({ where: { dealerId: session.userId } }),
    prisma.car.count({ where: { dealerId: session.userId, status: "ACTIVE" } }),
    prisma.car.count({ where: { dealerId: session.userId, status: "SOLD" } }),
    prisma.inquiry.count({ where: { car: { dealerId: session.userId } } }),
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
  const expiredCars = Math.max(totalCars - activeCars - soldCars, 0);
  const totalConversations = 0;
  const unreadMessages = 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dealer Dashboard</h1>
        <Badge className={statusClass}>{statusLabel}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className="space-y-4 md:col-span-1">
          <nav className="flex flex-col space-y-2 text-sm">
            <button className="rounded-xl px-4 py-2 text-left transition-all duration-300 hover:bg-zinc-800">Profile</button>
            <button className="rounded-xl px-4 py-2 text-left transition-all duration-300 hover:bg-zinc-800">Listings</button>
            <button className="rounded-xl px-4 py-2 text-left transition-all duration-300 hover:bg-zinc-800">Chat</button>
            <button className="rounded-xl px-4 py-2 text-left transition-all duration-300 hover:bg-zinc-800">Notifications</button>
            <button className="rounded-xl px-4 py-2 text-left transition-all duration-300 hover:bg-zinc-800">Settings</button>
          </nav>
        </aside>

        <div className="space-y-8 md:col-span-3">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all duration-300">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Profile</h2>
              <button className="rounded-2xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-600">Edit</button>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-zinc-400">Dealer Name:</span> Verified Dealer</p>
              <p><span className="text-zinc-400">Business Name:</span> OurAuto Partner</p>
              <p><span className="text-zinc-400">Mobile:</span> Not provided</p>
              <p><span className="text-zinc-400">Email:</span> Not provided</p>
              <p><span className="text-zinc-400">City:</span> Not provided</p>
              <p><span className="text-zinc-400">Bio:</span> Trusted B2B dealer on OurAuto.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all duration-300">
            <h2 className="mb-4 text-xl font-semibold">Listings</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Total Listings: {totalCars}</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Active: {activeCars}</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Sold: {soldCars}</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">Expired: {expiredCars}</div>
            </div>
            <p className="mt-4 text-sm text-zinc-300">
              Total Listings: {user?.totalListings ?? 0} • You are {listingsAway} listings away from next Hot Deal.
            </p>
          </section>

          <DealerAnalytics totalListings={totalCars} activeListings={activeCars} totalInquiries={totalInquiries} />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all duration-300">
            <h2 className="mb-4 text-xl font-semibold">Chat</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>Total Conversations: {totalConversations}</p>
              <p>Unread Messages: {unreadMessages}</p>
            </div>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
              Recent chats will appear here.
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all duration-300">
            <h2 className="mb-4 text-xl font-semibold">Notifications</h2>
            <div className="space-y-3 text-sm">
              <label className="flex items-center justify-between">
                <span>New Inquiry Alert</span>
                <input type="checkbox" className="accent-yellow-500" />
              </label>
              <label className="flex items-center justify-between">
                <span>Listing Expiry</span>
                <input type="checkbox" className="accent-yellow-500" />
              </label>
              <label className="flex items-center justify-between">
                <span>Promo Alert</span>
                <input type="checkbox" className="accent-yellow-500" />
              </label>
              <label className="flex items-center justify-between">
                <span>Chat Notification</span>
                <input type="checkbox" className="accent-yellow-500" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition-all duration-300">
            <h2 className="mb-4 text-xl font-semibold">Settings</h2>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-zinc-800 px-4 py-2 text-sm transition-all duration-300 hover:bg-zinc-700">Change Password</button>
              <button className="rounded-2xl bg-red-500/20 px-4 py-2 text-sm text-red-400 transition-all duration-300 hover:bg-red-500/30">Delete Account</button>
              <label className="flex items-center gap-2 rounded-2xl border border-zinc-800 px-4 py-2 text-sm">
                <span>Dark Mode</span>
                <input type="checkbox" className="accent-yellow-500" />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
              Wallet: ₹{wallet?.balance.toString() || "0"} • Hot Deal Credits: {user?.hotDealCredits ?? 0} • Future Ad Credits: {user?.futureAdCredits ?? 0}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/dealer/add-car" className="rounded-2xl bg-yellow-500 px-4 py-2 font-semibold text-black transition-all duration-300 hover:bg-yellow-600">Add Car</Link>
            <Link href="/dealer/listings" className="rounded-2xl bg-zinc-800 px-4 py-2 text-zinc-100 transition-all duration-300 hover:bg-zinc-700">Listings</Link>
            <Link href="/dealer/marketplace" className="rounded-2xl bg-zinc-800 px-4 py-2 text-zinc-100 transition-all duration-300 hover:bg-zinc-700">Marketplace</Link>
            <Link href="/dealer/chat" className="rounded-2xl bg-zinc-800 px-4 py-2 text-zinc-100 transition-all duration-300 hover:bg-zinc-700">Chat</Link>
            <Link href="/dealer/settings" className="rounded-2xl bg-zinc-800 px-4 py-2 text-zinc-100 transition-all duration-300 hover:bg-zinc-700">Settings</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
