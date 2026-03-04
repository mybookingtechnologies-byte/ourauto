import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBaseUrl } from "@/lib/baseUrl";
import { readDb } from "@/lib/prismaReplica";
import { redis } from "@/lib/redis";

export const revalidate = 300;

interface Props {
  params: { id: string };
}

async function getCarByIdFromDb(id: string) {
  return readDb.car.findFirst({
    where: {
      id,
      isActive: true,
      status: "ACTIVE",
      dealer: { role: "DEALER", status: "APPROVED" },
    },
    include: {
      media: {
        orderBy: { order: "asc" },
        take: 1,
      },
      dealer: {
        select: {
          id: true,
          dealerName: true,
          businessName: true,
        },
      },
    },
  });
}

type CachedCar = Awaited<ReturnType<typeof getCarByIdFromDb>>;

async function getCarById(id: string): Promise<CachedCar> {
  const region = process.env.VERCEL_REGION || process.env.APP_REGION || "global";
  const cacheKey = `car:${region}:${id}`;
  const cached = redis ? await redis.get<CachedCar>(cacheKey) : null;
  if (cached) {
    return cached;
  }

  const car = await getCarByIdFromDb(id);
  if (car && redis) {
    await redis.set(cacheKey, car, { ex: 120 });
  }

  return car;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getCarById(params.id);
  const baseUrl = getBaseUrl();

  if (!car) {
    return {
      title: "Vehicle Not Found | OurAuto",
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: `${baseUrl}/dealer/cars/${params.id}`,
      },
    };
  }

  const price = Number(car.price).toLocaleString("en-IN");
  const image = car.media[0]?.url;

  return {
    title: `${car.year} ${car.title} | OurAuto`,
    description: `${car.year} ${car.title} - ${car.km} km driven - ₹${price}`,
    alternates: {
      canonical: `${baseUrl}/dealer/cars/${params.id}`,
    },
    openGraph: {
      title: `${car.year} ${car.title}`,
      description: `${car.km} km driven - ₹${price}`,
      type: "website",
      url: `${baseUrl}/dealer/cars/${params.id}`,
      images: image ? [{ url: image, alt: car.title }] : undefined,
    },
  };
}

export default async function CarDetailPage({ params }: Props): Promise<JSX.Element> {
  const car = await getCarById(params.id);

  if (!car) {
    notFound();
  }

  const image = car.media[0]?.url || "https://placehold.co/1200x800?text=No+Image";
  const price = Number(car.price).toLocaleString("en-IN");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: car.title,
    brand: car.brand || "Car",
    model: car.model || car.title,
    vehicleModelDate: car.year,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: car.km,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: Number(car.price),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="text-sm text-muted-foreground">
        <Link href="/dealer/marketplace" className="hover:text-yellow-400">
          Marketplace
        </Link>{" "}
        / {car.title}
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <Image
            src={image}
            alt={car.title}
            width={800}
            height={600}
            className="h-full w-full rounded-2xl object-cover"
            priority
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">
            {car.year} {car.title}
          </h1>

          <p className="text-2xl font-bold text-yellow-400">₹{price}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-muted-foreground">Kilometers</p>
              <p className="font-semibold">{car.km} km</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-muted-foreground">Fuel Type</p>
              <p className="font-semibold">{car.fuel}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-muted-foreground">City</p>
              <p className="font-semibold">{car.city}</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-muted-foreground">Owner Count</p>
              <p className="font-semibold">{car.ownerCount ?? "N/A"}</p>
            </div>
          </div>

          {car.description ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
              {car.description}
            </div>
          ) : null}

          <div className="border-t border-zinc-800 pt-6">
            <p className="text-sm text-muted-foreground">Listed on {new Date(car.createdAt).toDateString()}</p>
            <div className="mt-3">
              <Link href={`/dealer/compare?ids=${car.id}`} className="text-sm text-yellow-400 transition-all duration-300 hover:text-yellow-300">
                Compare
              </Link>
            </div>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </div>
  );
}
