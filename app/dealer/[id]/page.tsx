import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { DealerCarGrid } from "@/components/forms/dealer-car-grid";
import { Header } from "@/components/layout/header";
import { isFutureAdActive, isHotDealActive } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dealer = await prisma.user.findUnique({
    where: { id: params.id },
    select: { dealerName: true, city: true, role: true, status: true },
  });

  if (!dealer || dealer.role !== "DEALER" || dealer.status !== "APPROVED") {
    return {
      title: "Dealer not found | OurAuto",
      description: "The requested dealer profile is unavailable.",
    };
  }

  const dealerName = dealer.dealerName || "Dealer";
  return {
    title: `${dealerName} | OurAuto Dealer Profile`,
    description: dealer.city ? `Browse verified listings from ${dealerName} in ${dealer.city}.` : `Browse verified listings from ${dealerName}.`,
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "D";
}

export default async function DealerPublicProfilePage({ params }: Props): Promise<JSX.Element> {
  const dealer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      dealerName: true,
      city: true,
      bio: true,
      profileImage: true,
      coverImage: true,
      role: true,
      status: true,
      cars: {
        where: { isActive: true, status: "ACTIVE" },
        orderBy: [{ isHotDeal: "desc" }, { isFutureAd: "desc" }, { createdAt: "desc" }],
        include: {
          media: {
            orderBy: { order: "asc" },
            select: { id: true, url: true },
          },
        },
      },
    },
  });

  if (!dealer || dealer.role !== "DEALER" || dealer.status !== "APPROVED") {
    notFound();
  }

  const dealerName = dealer.dealerName || "Dealer";
  const initials = getInitials(dealerName);
  const now = new Date();
  const cars = dealer.cars.map((car) => ({
    id: car.id,
    title: car.title,
    brand: car.brand,
    model: car.model,
    year: car.year,
    km: car.km,
    fuel: car.fuel,
    city: car.city,
    price: car.price.toString(),
    isUrgent: car.isUrgent,
    isHotDeal: isHotDealActive(car, now),
    isFutureAd: isFutureAdActive(car, now),
    verifiedDealer: true,
    media: car.media,
  }));

  return (
    <main>
      <Header />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="relative">
          {dealer.coverImage ? (
            <Image src={dealer.coverImage} alt={`${dealerName} cover`} width={1200} height={250} className="h-[250px] w-full rounded-xl object-cover" />
          ) : (
            <div className="h-[250px] w-full rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-700" />
          )}

          <div className="absolute -bottom-16 left-6 h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-zinc-200 bg-zinc-800 dark:border-zinc-800">
            {dealer.profileImage ? (
              <Image src={dealer.profileImage} alt={`${dealerName} profile`} width={120} height={120} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-bold text-zinc-100">{initials}</div>
            )}
          </div>
        </div>

        <div className="mt-20 px-1">
          <h1 className="text-2xl font-bold">{dealerName}</h1>
          <p className="mt-1 text-sm text-zinc-500">{dealer.city || "City not provided"}</p>
          <p className="mt-3 max-w-3xl text-sm text-zinc-400">{dealer.bio || "No bio added yet."}</p>
        </div>

        <div className="mt-8">
          <DealerCarGrid cars={cars} />
        </div>
      </section>
    </main>
  );
}
