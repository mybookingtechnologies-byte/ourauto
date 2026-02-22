const previewUrl = process.env.PREVIEW_URL;

if (!previewUrl) {
  console.error("PREVIEW_URL is required.");
  process.exit(1);
}

const baseUrl = previewUrl.replace(/\/$/, "");
const timeoutMs = 10_000;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchWithTimeout(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${path}`);
    }
    throw new Error(`Network error for ${path}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHomepage() {
  const response = await fetchWithTimeout("/");
  assert(response.status === 200, `Expected homepage 200, got ${response.status}`);
}

async function checkProtected401() {
  const response = await fetchWithTimeout("/api/referral/wallet");
  assert(response.status === 401, `Expected protected route 401, got ${response.status}`);
}

async function checkListingPost401() {
  const response = await fetchWithTimeout("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recaptchaToken: "x",
      regNo: "KA01AB1234",
      year: 2021,
      make: "Hyundai",
      model: "i20",
      transmission: "Manual",
      insurance: "Full till Dec 2026",
      price: 650000,
      km: 32000,
      seoTitle: "2021 Hyundai i20 Manual 32000 KM",
      fuelType: "Petrol",
      ownerType: "1st",
      mediaUrls: [],
      imageHashes: [],
    }),
  });

  assert(response.status === 401, `Expected listings POST 401 unauthenticated, got ${response.status}`);
}

async function checkRecaptchaRejectsEmptyToken() {
  const response = await fetchWithTimeout("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "dealer@example.com",
      password: "StrongPass123!",
      recaptchaToken: "",
    }),
  });

  assert(
    response.status === 400 || response.status === 403,
    `Expected reCAPTCHA-protected endpoint to reject empty token (400/403), got ${response.status}`
  );
}

async function checkRateLimit429() {
  const mockedIp = "203.0.113.10";
  const attempts = 230;
  let hit429 = false;

  for (let i = 0; i < attempts; i += 1) {
    const response = await fetchWithTimeout("/api/parser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": mockedIp,
      },
      body: JSON.stringify({
        message: "KA01AB1234 2020 Hyundai Price 650000 KM 32000 Insurance till 2026",
      }),
    });

    if (response.status === 429) {
      hit429 = true;
      break;
    }
  }

  assert(hit429, "Expected rate limit to return 429 when threshold exceeded.");
}

(async function run() {
  await checkHomepage();
  await checkProtected401();
  await checkListingPost401();
  await checkRecaptchaRejectsEmptyToken();
  await checkRateLimit429();
  console.log("Preview runtime smoke tests passed.");
})().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});