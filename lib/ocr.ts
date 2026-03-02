import Tesseract from "tesseract.js";

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
