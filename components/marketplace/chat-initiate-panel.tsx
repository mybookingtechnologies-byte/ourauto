"use client";

import { useState } from "react";
import { RecaptchaWidget } from "@/components/security/recaptcha-widget";
import type { Listing } from "@/types/domain";

export function ChatInitiatePanel({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [message, setMessage] = useState("Interested in this car. Please share final offer.");
  const [token, setToken] = useState("");

  async function initiateChat() {
    try {
      const response = await fetch("/api/chat/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, message, recaptchaToken: token }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      alert(payload.message ?? payload.error ?? "Done");
    } catch {
      alert("Request failed. Please try again.");
    }
  }

  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Contact Dealer</h2>
      <select
        className="w-full rounded-xl border border-black/10 bg-background p-3 dark:border-white/20"
        value={listingId}
        onChange={(event) => setListingId(event.target.value)}
      >
        {listings.map((listing) => (
          <option key={listing.id} value={listing.id}>
            {listing.title}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-24 w-full rounded-xl border border-black/10 bg-background p-3 dark:border-white/20"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <RecaptchaWidget onToken={setToken} />
      <button type="button" className="cta" onClick={initiateChat}>
        Start Chat
      </button>
    </section>
  );
}