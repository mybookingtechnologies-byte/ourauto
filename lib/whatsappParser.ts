export type ParsedWhatsappListing = {
  regNo: string;
  year: string;
  make: string;
  model: string;
  version: string;
  fuel: string;
  colour: string;
  owner: string;
  insuranceType: "Third Party" | "Full" | "";
  insuranceTill: string;
  km: string;
  price: number | null;
  transmission: "Manual" | "Automatic";
  title: string;
  remarks: string;
};

const LABEL_VALUE_REGEX = /^\s*(.+?)\s*[:：-]+\s*(.+)$/u;

const FIELD_PATTERNS = {
  regNo: /(reg(istration)?\s*(no|number)|rc\s*(no|number)?|rto)/i,
  year: /(year|yr|model\s*year)/i,
  make: /(make|brand|company)/i,
  model: /(model)/i,
  version: /(version|variant|trim)/i,
  fuel: /(fuel)/i,
  colour: /(colour|color)/i,
  owner: /(owner)/i,
  insurance: /(insurance|insur)/i,
  km: /(k\/?m|km|kilometer|kilometre|odometer|running)/i,
  price: /(\b(price|kimat|kimt|ki?mat|demand|expect(?:ed)?|amt|amount|rs|lakh|lac)\b|કીમત|ભાવ|कीमत)/i,
  transmission: /(transmission|gear|gearbox)/i,
};

const AUTOMATIC_WORDS = /\b(automatic|auto|at|amt|cvt|dct)\b/i;
const TP_WORDS = /\b(tp|third\s*party)\b/i;
const FULL_INSURANCE_WORDS = /\b(full\s*insurance|comprehensive|zero\s*dep|bumper\s*to\s*bumper)\b/i;
const INSURANCE_VALIDITY_WORDS = /\b(till|valid|validity|expiry|exp|insured\s*till|running)\b/i;
const YEAR_REGEX = /\b(19|20)\d{2}\b/;
const KM_REGEX = /\b(\d{4,7})\b/i;
const KM_LINE_VALUE_REGEX = /\d{4,7}/;
const REG_NO_REGEX = /\b[A-Z]{1,2}[\s-]?\d{1,2}[\s-]?[A-Z]{0,3}[\s-]?\d{3,4}\b/i;
const DATE_REGEX = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\s+\d{2,4}|[a-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b/i;
const PRICE_LINE_KEYWORDS = ["price", "kimat", "kimt", "કીમત", "ભાવ", "कीमत", "amount", "rs", "lakh", "lac"];
const KM_LINE_KEYWORDS = ["km", "k/m", "kilometer", "kilometre"];
const FUEL_KEYWORDS = ["petrol", "diesel", "cng", "electric", "hybrid", "પેટ્રોલ", "ડીઝલ", "पेट्रोल", "डीजल"];
const COLOUR_KEYWORDS = ["white", "grey", "gray", "silver", "black", "blue", "red", "brown", "green"];

function stripMessageNoise(text: string) {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\*/g, "")
    .replace(/\b(negotiable|nego|final)\b/gi, "")
    .replace(/\b(contact|call|whatsapp|urgent\s*sale|broker\s*pls\s*excuse|fixed\s*price)\b/gi, "")
    .replace(/₹/g, "")
    .replace(/[|]{2,}/g, "|")
    .trim();
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return cleanText(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizePrice(value: string, allowDecimalLakhShorthand = false): number | null {
  const text = value.toLowerCase();

  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(crore|cr)\b/);
  if (croreMatch) {
    const num = Number(croreMatch[1]);
    if (!Number.isFinite(num)) {
      return null;
    }

    return Math.round(num * 10000000);
  }

  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lac)/);

  if (lakhMatch) {
    const num = Number(lakhMatch[1]);
    if (!Number.isFinite(num)) {
      return null;
    }

    return Math.round(num * 100000);
  }

  if (allowDecimalLakhShorthand) {
    const decimalShorthandMatch = text.match(/\b(\d{1,2})[.,](\d{1,2})\b/);
    if (decimalShorthandMatch) {
      if (/\b\d{1,2}[.,]\d{1,2}[\/-]\d{2,4}\b/.test(text)) {
        return null;
      }

      const num = Number(`${decimalShorthandMatch[1]}.${decimalShorthandMatch[2]}`);
      if (!Number.isFinite(num)) {
        return null;
      }

      return Math.round(num * 100000);
    }
  }

  const thousandMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(k|thousand)\b/);
  if (thousandMatch) {
    const num = Number(thousandMatch[1]);
    if (!Number.isFinite(num)) {
      return null;
    }

    return Math.round(num * 1000);
  }

  const digits = text.replace(/[^\d]/g, "");

  if (!digits) {
    return null;
  }

  if (digits.length < 4) {
    return null;
  }

  const price = Number(digits);

  if (!Number.isFinite(price)) {
    return null;
  }

  return price;
}

function normalizeLabel(label: string) {
  return cleanText(label.toLowerCase());
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineHasKeyword(line: string, keyword: string) {
  const normalizedLine = line.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();

  if (/^[a-z]+$/i.test(normalizedKeyword)) {
    const pattern = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, "i");
    return pattern.test(line);
  }

  return normalizedLine.includes(normalizedKeyword);
}

function findLineByKeywords(lines: string[], keywords: string[]) {
  for (const line of lines) {
    if (keywords.some((keyword) => lineHasKeyword(line, keyword))) {
      return line;
    }
  }

  return "";
}

function detectFuel(value: string) {
  const lower = value.toLowerCase();
  const hit = FUEL_KEYWORDS.find((word) => lower.includes(word));
  return hit ? titleCase(hit) : "";
}

function parseKmFromLine(line: string) {
  const cleaned = line
    .replace(/\b(genuine|genuin|original|km|kms|k\/m|kilometer|kilometre)\b/gi, " ")
    .replace(/,/g, " ");

  const match = cleaned.match(KM_LINE_VALUE_REGEX) || line.match(KM_REGEX);
  if (!match) {
    return "";
  }

  return cleanText(match[0]);
}

function parseStandalonePrice(line: string): number | null {
  const normalized = cleanText(line.replace(/₹/g, ""));
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (/\b(year|yr|model|version|variant|owner|fuel|insurance|reg|rto|km|k\/m|kilometer|kilometre|odometer)\b/i.test(lower)) {
    return null;
  }

  if (!/^\d[\d.,\s]*$/.test(normalized)) {
    return null;
  }

  return normalizePrice(normalized);
}

function parseOwner(value: string) {
  const ordinal = value.match(/(\d)(st|nd|rd|th)/i);
  if (ordinal) {
    return `${ordinal[1]}${ordinal[2].toLowerCase()}`;
  }

  const numberOwner = value.match(/\b(\d)\s*(owner|ઓનર|मालिक)\b/i);
  if (numberOwner) {
    const suffix = numberOwner[1] === "1" ? "st" : numberOwner[1] === "2" ? "nd" : numberOwner[1] === "3" ? "rd" : "th";
    return `${numberOwner[1]}${suffix}`;
  }

  return "";
}

function parseInsuranceType(value: string): "Third Party" | "Full" | "" {
  if (TP_WORDS.test(value)) {
    return "Third Party";
  }

  if (FULL_INSURANCE_WORDS.test(value)) {
    return "Full";
  }

  return "";
}

function parseLabelValue(line: string) {
  const match = line.match(LABEL_VALUE_REGEX);
  if (!match) {
    return null;
  }

  return {
    label: normalizeLabel(match[1]),
    value: cleanText(match[2]),
  };
}

function buildTitle(draft: ParsedWhatsappListing) {
  const values = [draft.year, draft.make, draft.model, draft.version, draft.transmission || "Manual"]
    .map((v) => cleanText(v))
    .filter((v) => v.length > 0);

  return values.join(" ").trim();
}

export function parseWhatsappDescription(input: string): ParsedWhatsappListing {
  const source = input || "";
  const cleanSource = stripMessageNoise(source);
  const lines = cleanSource
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ParsedWhatsappListing = {
    regNo: "",
    year: "",
    make: "",
    model: "",
    version: "",
    fuel: "",
    colour: "",
    owner: "",
    insuranceType: "",
    insuranceTill: "",
    km: "",
    price: null,
    transmission: "Manual",
    title: "",
    remarks: "",
  };

  const consumed = new Set<number>();

  lines.forEach((line, index) => {
    const normalizedLine = cleanText(line);
    const lowerLine = normalizedLine.toLowerCase();
    const labelValue = parseLabelValue(normalizedLine);
    const label = labelValue?.label || "";
    const value = labelValue?.value || "";
    let matched = false;

    if (!parsed.regNo) {
      if (label && FIELD_PATTERNS.regNo.test(label) && value) {
        parsed.regNo = value;
        matched = true;
      } else {
        const regNo = normalizedLine.match(REG_NO_REGEX)?.[0];
        if (regNo) {
          parsed.regNo = cleanText(regNo);
          matched = true;
        }
      }
    }

    if (!parsed.year) {
      const yearSource = value || normalizedLine;
      const year = yearSource.match(YEAR_REGEX)?.[0];
      if ((label && FIELD_PATTERNS.year.test(label)) || year) {
        parsed.year = year || "";
        matched = matched || Boolean(parsed.year);
      }
    }

    if (!parsed.make) {
      const makeFromLabel = label && FIELD_PATTERNS.make.test(label) ? value.match(/([a-zA-Z]+)/)?.[1] || value : "";
      const makeFromInline = normalizedLine.match(/make\s*[:-]?\s*([a-zA-Z]+)/i)?.[1] || "";
      const make = makeFromLabel || makeFromInline;
      if (make) {
        parsed.make = titleCase(make);
        matched = true;
      }
    }

    if (!parsed.model) {
      const modelFromLabel = label && FIELD_PATTERNS.model.test(label) ? value : "";
      const modelFromInline = normalizedLine.match(/model\s*[:-]?\s*([a-zA-Z0-9.+\- ]+)/i)?.[1] || "";
      const model = cleanText(modelFromLabel || modelFromInline);
      if (model) {
        parsed.model = titleCase(model);
        matched = true;
      }
    }

    if (!parsed.version) {
      const versionFromLabel = label && FIELD_PATTERNS.version.test(label) ? value : "";
      const versionFromInline = normalizedLine.match(/version\s*[:-]?\s*([a-zA-Z0-9.+\- ]+)/i)?.[1] || "";
      const version = cleanText(versionFromLabel || versionFromInline);
      if (version) {
        parsed.version = version;
        matched = true;
      }
    }

    if (!parsed.fuel) {
      const fuelByLabel = label && FIELD_PATTERNS.fuel.test(label) ? detectFuel(value) : "";
      const fuelByLine = detectFuel(normalizedLine);
      const fuel = fuelByLabel || fuelByLine;
      if (fuel) {
        parsed.fuel = fuel;
        matched = true;
      }
    }

    if (!parsed.colour) {
      const colourFromLabel = label && FIELD_PATTERNS.colour.test(label) ? value : "";
      const inlineColourMatch = normalizedLine.match(/(?:colour|color)\s*[:-]?\s*([a-zA-Z ]+)/i)?.[1] || "";
      const keywordColour = COLOUR_KEYWORDS.find((keyword) => lowerLine.includes(keyword)) || "";
      const colour = cleanText(colourFromLabel || inlineColourMatch || keywordColour);
      if (colour) {
        parsed.colour = titleCase(colour);
        matched = true;
      }
    }

    if (!parsed.owner) {
      const ownerFromLabel = label && FIELD_PATTERNS.owner.test(label) ? parseOwner(value) : "";
      const ownerFromLine = parseOwner(normalizedLine);
      const owner = ownerFromLabel || ownerFromLine;
      if (owner) {
        parsed.owner = owner;
        matched = true;
      }
    }

    if (!parsed.insuranceType) {
      const insuranceSource = (label && FIELD_PATTERNS.insurance.test(label) ? value : "") || normalizedLine;
      const insuranceType = parseInsuranceType(insuranceSource);
      if (insuranceType) {
        parsed.insuranceType = insuranceType;
        matched = true;
      }
    }

    if (!parsed.insuranceTill) {
      const insuranceDate = normalizedLine.match(DATE_REGEX)?.[0];
      if (insuranceDate && (FIELD_PATTERNS.insurance.test(label) || INSURANCE_VALIDITY_WORDS.test(normalizedLine))) {
        parsed.insuranceTill = cleanText(insuranceDate);
        matched = true;
      }
    }

    if (!parsed.km) {
      const hasKmContext = (label && FIELD_PATTERNS.km.test(label)) || KM_LINE_KEYWORDS.some((keyword) => lineHasKeyword(lowerLine, keyword));
      if (hasKmContext) {
        const km = parseKmFromLine(value || normalizedLine);
        if (km) {
          parsed.km = km;
          matched = true;
        }
      }
    }

    if (!parsed.price) {
      const isPriceLabel = label && FIELD_PATTERNS.price.test(label);
      const isPriceKeyword = PRICE_LINE_KEYWORDS.some((keyword) => lineHasKeyword(lowerLine, keyword));

      if (isPriceLabel || isPriceKeyword) {
        const price = normalizePrice(value || normalizedLine, true);

        if (price && price > 5000) {
          parsed.price = price;
          matched = true;
        }
      }
    }

    if ((label && FIELD_PATTERNS.transmission.test(label)) || AUTOMATIC_WORDS.test(normalizedLine)) {
      parsed.transmission = AUTOMATIC_WORDS.test(normalizedLine) ? "Automatic" : parsed.transmission;
      matched = true;
    }

    if (matched) {
      consumed.add(index);
    }
  });

  if (!parsed.regNo) {
    const regNo = cleanSource.match(REG_NO_REGEX)?.[0];
    if (regNo) {
      parsed.regNo = cleanText(regNo);
    }
  }

  if (!parsed.year) {
    const year = cleanSource.match(YEAR_REGEX)?.[0];
    if (year) {
      parsed.year = year;
    }
  }

  if (!parsed.km) {
    const kmLine = findLineByKeywords(lines, KM_LINE_KEYWORDS);
    if (kmLine) {
      parsed.km = parseKmFromLine(kmLine);
    }
  }

  if (!parsed.price) {
    const priceLine = findLineByKeywords(lines, PRICE_LINE_KEYWORDS);

    if (priceLine) {
      const price = normalizePrice(priceLine, true);

      if (price && price > 5000) {
        parsed.price = price;
      }
    }
  }

  if (!parsed.price) {
    for (const line of lines) {
      const price = parseStandalonePrice(line);

      if (price && price > 5000) {
        parsed.price = price;
        break;
      }
    }
  }

  if (AUTOMATIC_WORDS.test(cleanSource)) {
    parsed.transmission = "Automatic";
  }

  if (!parsed.insuranceType) {
    if (TP_WORDS.test(cleanSource)) {
      parsed.insuranceType = "Third Party";
    } else if (FULL_INSURANCE_WORDS.test(cleanSource)) {
      parsed.insuranceType = "Full";
      const date = cleanSource.match(DATE_REGEX)?.[0];
      if (date) {
        parsed.insuranceTill = cleanText(date);
      }
    }
  }

  if (!parsed.fuel) {
    parsed.fuel = detectFuel(cleanSource);
  }

  if (!parsed.owner) {
    parsed.owner = parseOwner(cleanSource);
  }

  if (!parsed.colour) {
    const colour = COLOUR_KEYWORDS.find((keyword) => cleanSource.toLowerCase().includes(keyword));
    if (colour) {
      parsed.colour = titleCase(colour);
    }
  }

  if (!parsed.make) {
    const make = cleanSource.match(/make\s*[:-]?\s*([a-zA-Z]+)/i)?.[1];
    if (make) {
      parsed.make = titleCase(make);
    }
  }

  if (!parsed.model) {
    const model = cleanSource.match(/model\s*[:-]?\s*([a-zA-Z0-9.+\- ]+)/i)?.[1];
    if (model) {
      parsed.model = titleCase(model);
    }
  }

  if (!parsed.version) {
    const version = cleanSource.match(/version\s*[:-]?\s*([a-zA-Z0-9.+\- ]+)/i)?.[1];
    if (version) {
      parsed.version = cleanText(version);
    }
  }

  const remarks = lines
    .filter((_, index) => !consumed.has(index))
    .join(" | ")
    .trim();

  parsed.remarks = remarks;
  parsed.title = buildTitle(parsed);

  return parsed;
}
