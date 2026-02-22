"use client";

import { useMemo, useState } from "react";
import { RecaptchaWidget } from "@/components/security/recaptcha-widget";
import { suggestPrice } from "@/lib/business/pricing";
import type { SmartParseResult } from "@/types/domain";

const emptyParsed: SmartParseResult = {
  regNo: "",
  year: null,
  make: "",
  transmission: "Manual",
  insurance: "Insurance not specified",
  price: null,
  km: null,
  seoTitle: "",
};

export default function NewListingPage() {
  const [message, setMessage] = useState("");
  const [parsed, setParsed] = useState<SmartParseResult>(emptyParsed);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);

  const aiSuggestedPrice = useMemo(() => {
    if (!parsed.year || !parsed.km || !parsed.price) return null;
    return suggestPrice({
      basePrice: parsed.price,
      year: parsed.year,
      km: parsed.km,
      modelFactor: 0.03,
    });
  }, [parsed.km, parsed.price, parsed.year]);

  async function parseMessage() {
    const response = await fetch("/api/parser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const payload = (await response.json()) as { parsed: SmartParseResult };
    setParsed(payload.parsed);
  }

  async function runOcrCheck() {
    if (!imageFile) {
      setOcrStatus("Upload a main image before OCR check.");
      return;
    }

    const formData = new FormData();
    formData.set("image", imageFile);

    const response = await fetch("/api/ocr-check", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json()) as { error: string };
      setOcrStatus(data.error);
      return;
    }

    const data = (await response.json()) as { message: string; imageHash?: string };
    if (data.imageHash) setImageHash(data.imageHash);
    setOcrStatus(data.message);
  }

  async function submitListing() {
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parsed,
        recaptchaToken,
        mediaUrls: [],
        model: "Unknown Model",
        fuelType: "Petrol",
        ownerType: "1st",
        imageHashes: imageHash ? [imageHash] : [],
      }),
    });

    const data = (await response.json()) as { message?: string; error?: string };
    alert(data.message ?? data.error ?? "Done");
  }

  return (
    <main className="app-shell space-y-5 py-5">
      <h1 className="text-2xl font-bold">Add Listing</h1>

      <section className="card space-y-3">
        <h2 className="font-semibold">Smart Listing Parser</h2>
        <textarea
          className="min-h-40 w-full rounded-xl border border-black/10 bg-background p-3 dark:border-white/20"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Paste WhatsApp-style listing message"
        />
        <button type="button" className="cta" onClick={parseMessage}>
          Parse Listing
        </button>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold">OCR Duplicate Protection</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
        <button type="button" className="rounded-xl border px-4 py-2" onClick={runOcrCheck}>
          Run OCR Duplicate Check
        </button>
        {ocrStatus && <p className="text-sm text-muted">{ocrStatus}</p>}
      </section>

      <section className="card grid gap-2 text-sm md:grid-cols-2">
        <Info label="Reg No" value={parsed.regNo || "-"} />
        <Info label="Year" value={parsed.year?.toString() ?? "-"} />
        <Info label="Make" value={parsed.make || "-"} />
        <Info label="Transmission" value={parsed.transmission} />
        <Info label="Insurance" value={parsed.insurance} />
        <Info label="Price" value={parsed.price ? parsed.price.toString() : "-"} />
        <Info label="KM" value={parsed.km ? parsed.km.toString() : "-"} />
        <Info label="SEO Title" value={parsed.seoTitle || "-"} />
        <Info label="AI Suggested Price" value={aiSuggestedPrice?.toString() ?? "-"} />
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Security Check</h2>
        <RecaptchaWidget onToken={setRecaptchaToken} />
        <button type="button" className="cta" onClick={submitListing}>
          Publish Listing
        </button>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted">{label}:</span> {value}
    </p>
  );
}