import Tesseract from "tesseract.js";

/*
Future OCR architecture (do not run OCR in publish requests):
- Publish flow saves the car immediately and marks OCR state as PENDING (once schema supports it).
- Background processing must run outside request threads (BullMQ worker, Vercel background function, or external service).
- Worker polls PENDING cars, runs OCR safely, stores extracted data, then sets OCR state to DONE/FAILED.
- OCR failures are logged and never block listing activation; cars remain ACTIVE regardless of OCR outcome.
*/

const plateRegex = /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/g;

export async function extractPlateNumber(imageUrl: string): Promise<string | null> {
  try {
    const { data } = await Tesseract.recognize(imageUrl, "eng");
    const normalized = data.text.replace(/\s+/g, "").toUpperCase();
    const matches = normalized.match(plateRegex);
    if (!matches || matches.length === 0) {
      return null;
    }
    return matches[0];
  } catch {
    return null;
  }
}
