"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/types/domain";

function maskRegistration(regNo: string) {
  if (regNo.length <= 4) return "••••";
  const suffix = regNo.slice(-4);
  return `••••${suffix}`;
}

export function ListingCard({
  listing,
  onViewed,
}: {
  listing: Listing;
  onViewed: (listingId: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [pulse, setPulse] = useState(false);
  const tappedAt = useRef(0);

  useEffect(() => {
    onViewed(listing.id);
  }, [listing.id, onViewed]);

  return (
    <article
      className="relative h-[86vh] snap-start overflow-hidden rounded-3xl border border-black/10 bg-black text-white dark:border-white/10"
      onClick={() => {
        const now = Date.now();
        if (now - tappedAt.current < 280) {
          setLiked(true);
          setPulse(true);
          setTimeout(() => setPulse(false), 450);
        }
        tappedAt.current = now;
      }}
    >
      {listing.videoUrl ? (
        <video
          className="h-full w-full object-cover"
          src={listing.videoUrl}
          muted
          loop
          autoPlay
          playsInline
        />
      ) : (
        <Image
          src={listing.mediaUrls[0]}
          alt={listing.title}
          fill
          className="object-cover"
          loading="lazy"
          unoptimized
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {listing.isHotDeal && (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-black">
            Hot Deal
          </span>
        )}
        <button
          type="button"
          onClick={() => setLiked((state) => !state)}
          className="rounded-full bg-white/20 p-2"
          aria-label="Save listing"
        >
          <span className={`text-2xl ${liked ? "text-accent" : "text-white"}`}>♥</span>
        </button>
      </div>

      {pulse && (
        <div className="absolute inset-0 grid place-items-center text-7xl text-accent/90 animate-ping">♥</div>
      )}

      <div className="absolute bottom-0 w-full p-4 sm:p-6">
        <h3 className="text-xl font-bold">{listing.title}</h3>
        <p className="text-sm text-white/80">
          {listing.year} · {listing.fuelType} · {listing.transmission} · {listing.km.toLocaleString("en-IN")} KM
        </p>
        <p className="text-xs text-white/70">
          {listing.city}, {listing.state} · Reg: {maskRegistration(listing.registrationNumber)}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-semibold text-accent">₹{listing.price.toLocaleString("en-IN")}</p>
          <Link href={`/dealer/${listing.dealerId}`} className="cta text-sm">
            Dealer Profile
          </Link>
        </div>
      </div>
    </article>
  );
}