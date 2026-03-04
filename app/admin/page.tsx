import prisma from "@/lib/prisma";
import SystemStatusCard from "./SystemStatusCard";

export default async function AdminDashboardPage() {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [
    totalDealers,
    totalListings,
    liveListings,
    deletedListings,
    todaysListings,
    todaysSignups,
    todaysLogins,
    hotDealsUsed,
    futureAdsUsed,
    suspiciousDealers,
    dealerReputation,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "DEALER" } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { isLive: true } }),
    prisma.listing.count({ where: { deletedByAdmin: true } }),
    prisma.listing.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.user.count({ where: { role: "DEALER", createdAt: { gte: dayStart } } }),
    prisma.activityLog.count({ where: { action: "LOGIN", createdAt: { gte: dayStart } } }),
    prisma.listing.count({ where: { boostType: "HOT_DEAL" } }),
    prisma.listing.count({ where: { boostType: "FUTURE_AD" } }),
    prisma.user.count({ where: { role: "DEALER", reputationScore: { lt: 40 } } }),
    prisma.user.findMany({
      where: { role: "DEALER" },
      select: {
        id: true,
        dealerName: true,
        totalListings: true,
        duplicateListings: true,
        spamReports: true,
        reputationScore: true,
      },
      orderBy: [{ reputationScore: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);

  function scoreClass(score: number) {
    if (score >= 90) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }

    if (score >= 70) {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    }

    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }

  const cards = [
    { label: "Total Dealers", value: totalDealers },
    { label: "Total Listings", value: totalListings },
    { label: "Live Listings", value: liveListings },
    { label: "Deleted Listings", value: deletedListings },
    { label: "Today's Listings", value: todaysListings },
    { label: "Today's Signups", value: todaysSignups },
    { label: "Today's Logins", value: todaysLogins },
    { label: "Hot Deals Used", value: hotDealsUsed },
    { label: "Future Ads Used", value: futureAdsUsed },
    { label: "Suspicious Dealers", value: suspiciousDealers },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{card.value}</p>
          </article>
        ))}
      </section>

      <article className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">Dealer Reputation</h2>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-3 py-2 font-medium">Dealer</th>
              <th className="px-3 py-2 font-medium">Listings</th>
              <th className="px-3 py-2 font-medium">Duplicates</th>
              <th className="px-3 py-2 font-medium">Spam Reports</th>
              <th className="px-3 py-2 font-medium">Reputation Score</th>
            </tr>
          </thead>
          <tbody>
            {dealerReputation.map((dealer) => (
              <tr key={dealer.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.dealerName}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.totalListings}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.duplicateListings}</td>
                <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">{dealer.spamReports}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${scoreClass(dealer.reputationScore)}`}>
                    {dealer.reputationScore}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <SystemStatusCard />
    </div>
  );
}
