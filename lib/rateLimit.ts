import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) {
    return true;
  }

  try {
    const now = Date.now();
    const redisKey = key;

    await redis.zadd(redisKey, { score: now, member: `${now}` });
    await redis.zremrangebyscore(redisKey, 0, now - windowMs);
    const count = await redis.zcard(redisKey);

    await redis.expire(redisKey, Math.ceil(windowMs / 1000));
    return count <= limit;
  } catch {
    return true;
  }
}

export function rateLimitExceededResponse(): NextResponse {
  return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
}
