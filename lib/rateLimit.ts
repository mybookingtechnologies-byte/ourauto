type LimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, LimitRecord>();
const MAX_BUCKETS = 20_000;

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, record] of buckets.entries()) {
    if (record.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function getUserAgent(request: Request) {
  return request.headers.get("user-agent") || "unknown-agent";
}

function getRateLimitKey(request: Request, keyPrefix: string) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  return `${keyPrefix}:${ip}:${userAgent}`;
}

async function incrementRedisBucket(key: string, windowMs: number) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    return null;
  }

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  const incrementResponse = await fetch(`${baseUrl}/incr/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!incrementResponse.ok) {
    return null;
  }

  const incrementPayload = await incrementResponse.json() as { result?: number };
  const currentCount = Number(incrementPayload.result ?? 0);

  if (currentCount <= 1) {
    await fetch(`${baseUrl}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  }

  return currentCount;
}

export async function isRateLimited(request: Request, keyPrefix: string, limit: number, windowMs: number) {
  const key = getRateLimitKey(request, keyPrefix);
  const now = Date.now();

  try {
    const redisCount = await incrementRedisBucket(key, windowMs);
    if (typeof redisCount === "number") {
      return redisCount > limit;
    }
  } catch {
    // fallback to in-memory limiter below
  }

  cleanupExpiredBuckets(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (current.count >= limit) {
    return true;
  }

  current.count += 1;
  buckets.set(key, current);
  return false;
}
