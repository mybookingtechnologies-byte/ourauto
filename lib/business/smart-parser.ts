import type { SmartParseResult, Transmission } from "@/types/domain";

function sanitizeNumber(raw: string) {
  const clean = raw.replace(/[^\d]/g, "");
  return clean ? Number.parseInt(clean, 10) : null;
}

function detectTransmission(message: string): Transmission {
  return /\bauto\b|automatic/i.test(message) ? "Automatic" : "Manual";
}

function detectInsurance(message: string) {
  const line = message
    .split(/\n|\|/)
    .find((segment) => /insurance|ins|policy/i.test(segment));

  const fallback = line?.trim() ?? "Insurance not specified";
  return /till/i.test(fallback) ? `Full ${fallback}` : fallback;
}

function detectRegNo(message: string) {
  const match = message.match(
    /\b([A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{3,4}|[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4})\b/i
  );
  return match?.[1]?.replace(/\s+/g, "").toUpperCase() ?? "";
}

function detectYear(message: string) {
  const current = new Date().getFullYear() + 1;
  const matches = message.match(/\b(19\d{2}|20\d{2})\b/g) ?? [];
  const years = matches
    .map((item) => Number.parseInt(item, 10))
    .filter((value) => value >= 1990 && value <= current);
  return years.length ? years[0] : null;
}

function detectMake(message: string) {
  const makes = [
    "Maruti",
    "Hyundai",
    "Tata",
    "Mahindra",
    "Honda",
    "Toyota",
    "Kia",
    "Skoda",
    "Volkswagen",
    "Renault",
    "Nissan",
    "MG",
    "Ford",
  ];
  const found = makes.find((make) => new RegExp(`\\b${make}\\b`, "i").test(message));
  return found ?? "Unknown Make";
}

function detectPrice(message: string) {
  const match = message.match(/(?:price|rs|inr|₹)\s*[:\-]?\s*([\d,\.]+(?:\s*lakh)?)/i);
  if (!match) {
    return null;
  }
  const raw = match[1].toLowerCase();
  if (raw.includes("lakh")) {
    const base = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
    return Number.isFinite(base) ? Math.round(base * 100000) : null;
  }
  return sanitizeNumber(raw);
}

function detectKm(message: string) {
  const match = message.match(/(?:km|kms|kilometer|kilometre)\s*[:\-]?\s*([\d,\.]+)/i);
  if (match?.[1]) {
    return sanitizeNumber(match[1]);
  }
  const reverse = message.match(/([\d,\.]+)\s*(?:km|kms|kilometer|kilometre)/i);
  return reverse?.[1] ? sanitizeNumber(reverse[1]) : null;
}

function buildSeoTitle(data: {
  year: number | null;
  make: string;
  transmission: Transmission;
  km: number | null;
  city?: string;
}) {
  const year = data.year ?? "Used";
  const km = data.km ? `${data.km.toLocaleString("en-IN")} KM` : "Verified KM";
  const location = data.city ? `in ${data.city}` : "";
  return `${year} ${data.make} ${data.transmission} - ${km} ${location}`.trim();
}

export function parseListingMessage(message: string, city?: string): SmartParseResult {
  const transmission = detectTransmission(message);
  const year = detectYear(message);
  const make = detectMake(message);
  const km = detectKm(message);

  return {
    regNo: detectRegNo(message),
    year,
    make,
    transmission,
    insurance: detectInsurance(message),
    price: detectPrice(message),
    km,
    seoTitle: buildSeoTitle({ year, make, transmission, km, city }),
  };
}