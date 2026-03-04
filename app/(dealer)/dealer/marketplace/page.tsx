import Link from "next/link";
import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/baseUrl";
import { meili } from "@/lib/meili";
import { prisma } from "@/lib/prisma";
import { readDb } from "@/lib/prismaReplica";
import { redis } from "@/lib/redis";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dealer Marketplace | OurAuto",
  description: "Verified B2B used car marketplace for professional dealers.",
  openGraph: {
    title: "Dealer Marketplace | OurAuto",
    description: "India’s trusted dealer-only wholesale car network.",
    url: getBaseUrl(),
    siteName: "OurAuto",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

type MarketplaceCar = Awaited<ReturnType<typeof getMarketplaceCars>>[number];

async function getMarketplaceCars(skip: number, take: number) {
  return readDb.car.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
      dealer: { role: "DEALER", status: "APPROVED" },
    },
    include: {
      dealer: {
        select: {
          id: true,
          dealerName: true,
          businessName: true,
          city: true,
        },
      },
    },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
}

export default async function DealerMarketplacePage({ searchParams }: PageProps): Promise<JSX.Element> {
  const session = await getSessionUser();
  if (!session) {
    return <main className="p-6">Unauthorized</main>;
  }

  const pageParam = searchParams?.page;
  const pageRaw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const qParam = searchParams?.q;
  const qRaw = Array.isArray(qParam) ? qParam[0] : qParam;
  const q = typeof qRaw === "string" ? qRaw.trim() : "";
  const parsedPage = Number(pageRaw || 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const count = await prisma.car.count({ where: { dealerId: session.userId } });
  if (count < 3) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6 py-12">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center transition-all duration-300">
          <h1 className="text-xl font-bold">Marketplace Locked</h1>
          <p className="mt-2">List minimum 3 cars to activate marketplace.</p>
          <Link href="/dealer/add-car" className="mt-4 inline-block rounded-2xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-600">
            Add Car
          </Link>
        </div>
      </main>
    );
  }

  const total = await readDb.car.count({
    where: {
      isActive: true,
      status: "ACTIVE",
      dealer: { role: "DEALER", status: "APPROVED" },
    },
  });

  let cars: MarketplaceCar[] = [];

  if (q && meili) {
    const result = await meili.index("cars").search(q, {
      limit,
      offset: skip,
      attributesToRetrieve: ["id"],
    });
    const ids = result.hits
      .map((hit) => {
        const value = (hit as { id?: unknown }).id;
        return typeof value === "string" ? value : null;
      })
      .filter((id): id is string => Boolean(id));

    if (ids.length > 0) {
      const indexedCars = await readDb.car.findMany({
        where: {
          id: { in: ids },
          isActive: true,
          status: "ACTIVE",
          dealer: { role: "DEALER", status: "APPROVED" },
        },
        include: {
          dealer: {
            select: {
              id: true,
              dealerName: true,
              businessName: true,
              city: true,
            },
          },
        },
      });

      cars = ids
        .map((id) => indexedCars.find((car) => car.id === id))
        .filter((car): car is MarketplaceCar => Boolean(car));
    }
  } else {
    const region = process.env.VERCEL_REGION || process.env.APP_REGION || "global";
    const cacheKey = `marketplace:${region}:page:${page}`;
    const cached = redis ? await redis.get<MarketplaceCar[]>(cacheKey) : null;

    if (cached) {
      cars = cached;
    } else {
      cars = await getMarketplaceCars(skip, limit);
      if (redis) {
        await redis.set(cacheKey, cars, { ex: 60 });
      }
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="mb-8 space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dealer Marketplace</h1>
          <p className="mt-2 text-muted-foreground">Verified B2B Inventory for Professional Dealers</p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">1,248 Cars</div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">320 Dealers</div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">98% Verified</div>
        </div>
      </section>

      <div className="sticky top-4 z-40 mb-8 rounded-2xl border border-zinc-800 bg-black/40 p-4 backdrop-blur-md">
        <div className="grid gap-3 md:grid-cols-6">
          <select className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/60">
            <option>All Brands</option>
            <option>Toyota</option>
            <option>Hyundai</option>
            <option>Honda</option>
          </select>
          <select className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/60">
            <option>Price Range</option>
            <option>Below ₹10L</option>
            <option>₹10L - ₹20L</option>
            <option>Above ₹20L</option>
          </select>
          <select className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/60">
            <option>Transmission</option>
            <option>Manual</option>
            <option>Automatic</option>
          </select>
          <select className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/60">
            <option>Body Type</option>
            <option>SUV</option>
            <option>Sedan</option>
            <option>Hatchback</option>
          </select>
          <select className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500/60">
            <option>City</option>
            <option>Ahmedabad</option>
            <option>Surat</option>
            <option>Rajkot</option>
          </select>
          <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm">
            <span>Verified Only</span>
            <input type="checkbox" className="accent-yellow-500" />
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cars.map((car) => (
          <div key={car.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/10">
            <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-400">Image Placeholder</div>
            <h2 className="text-lg font-semibold">{car.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">Dealer: {car.dealer.businessName || car.dealer.dealerName || "Verified Dealer"}</p>
            <p className="mt-2 text-sm text-zinc-300">
              {car.year} • {car.km.toLocaleString()} km • {car.city}
            </p>
            <p className="mt-3 text-xl font-bold text-yellow-400">₹{Number(car.price).toLocaleString("en-IN")}</p>
            <div className="mt-4 flex items-center justify-between">
              <Link href="/dealer/marketplace" className="rounded-2xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition-all duration-300 hover:bg-yellow-600">
                Contact Dealer
              </Link>
              <Link href={`/dealer/cars/${car.id}`} className="text-sm text-yellow-400 transition-all duration-300 hover:text-yellow-300">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center gap-4">
        {page > 1 ? (
          <Link href={q ? `?page=${page - 1}&q=${encodeURIComponent(q)}` : `?page=${page - 1}`}>
            <button className="rounded-xl bg-zinc-800 px-4 py-2">Previous</button>
          </Link>
        ) : null}

        {skip + limit < total ? (
          <Link href={q ? `?page=${page + 1}&q=${encodeURIComponent(q)}` : `?page=${page + 1}`}>
            <button className="rounded-xl bg-yellow-500 px-4 py-2 text-black">Next</button>
          </Link>
        ) : null}
      </div>
    </main>
  );
}
