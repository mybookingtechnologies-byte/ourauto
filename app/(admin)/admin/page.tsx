import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DealerManagement } from "@/components/admin/DealerManagement";
import { ListingModeration } from "@/components/admin/ListingModeration";
import { Reports } from "@/components/admin/Reports";
import { Settings } from "@/components/admin/Settings";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/dealer/marketplace");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalDealers, totalListings, activeToday, topCitiesRaw, topBrandsRaw] = await Promise.all([
    prisma.user.count({ where: { role: "DEALER", status: "APPROVED" } }),
    prisma.car.count(),
    prisma.car.count({ where: { updatedAt: { gte: startOfDay }, isActive: true } }),
    prisma.car.groupBy({
      by: ["city"],
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 5,
    }),
    prisma.car.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 5,
    }),
  ]);

  const topCities = topCitiesRaw.map((row) => ({ value: row.city, count: row._count.city }));
  const topBrands = topBrandsRaw.map((row) => ({ value: row.brand, count: row._count.brand }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Admin Control Panel</h1>
      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <AdminSidebar />
        </div>
        <div className="space-y-6 md:col-span-3">
          <AdminDashboard totalDealers={totalDealers} totalListings={totalListings} activeToday={activeToday} />
          <DealerManagement />
          <ListingModeration />
          <Reports topCities={topCities} topBrands={topBrands} growthMetric="Weekly growth metric will be surfaced from analytics pipeline." />
          <Settings />
        </div>
      </div>
    </main>
  );
}
