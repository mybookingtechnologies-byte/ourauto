const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer(timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/`, { method: "GET" });
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // no-op
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function testAuthEndpointUnauthorized() {
  const response = await fetch(`${baseUrl}/api/referral/wallet`, {
    method: "GET",
  });
  assert(response.status === 401, `Expected 401 for unauthenticated auth-protected endpoint, got ${response.status}`);
}

async function testListingsPostUnauthorized() {
  const response = await fetch(`${baseUrl}/api/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recaptchaToken: "invalid",
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
  assert(response.status === 401, `Expected 401 for unauthenticated listings POST, got ${response.status}`);
}

async function testRateLimitExceeded() {
  const attempts = 230;
  let saw429 = false;
  const mockedIp = "203.0.113.10";

  for (let index = 0; index < attempts; index += 1) {
    const response = await fetch(`${baseUrl}/api/parser`, {
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
      saw429 = true;
      break;
    }
  }

  assert(saw429, "Expected middleware/API rate limiting to return HTTP 429 when threshold is exceeded.");
}

(async function run() {
  await waitForServer();
  await testAuthEndpointUnauthorized();
  await testListingsPostUnauthorized();
  await testRateLimitExceeded();
  console.log("Smoke API checks passed.");
})().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
