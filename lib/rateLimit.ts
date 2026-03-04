import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const memoryBuckets = new Map<string, number[]>();

function pruneMemoryBucket(key: string, now: number, windowMs: number): number[] {
  const existing = memoryBuckets.get(key) || [];
  const filtered = existing.filter((timestamp) => timestamp > now - windowMs);
  memoryBuckets.set(key, filtered);
  return filtered;
}

async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const consumeInMemory = (): boolean => {
    const bucket = pruneMemoryBucket(key, now, windowMs);
    bucket.push(now);
    memoryBuckets.set(key, bucket);
    return bucket.length <= limit;
  };

  if (redis) {
    try {
      const redisKey = key;
      await redis.zadd(redisKey, { score: now, member: `${now}:${Math.random()}` });
      await redis.zremrangebyscore(redisKey, 0, now - windowMs);
      const count = await redis.zcard(redisKey);
      await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      return count <= limit;
    } catch {
      return consumeInMemory();
    }
  }

  return consumeInMemory();
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return consumeRateLimit(key, limit, windowMs);
}

export function rateLimitExceededResponse(): NextResponse {
  return NextResponse.json({ success: false, message: "Too many requests" }, { status: 429 });
}

export const rateLimit = {
  async limit(identifier: string): Promise<{ success: boolean }> {
    const success = await consumeRateLimit(`middleware:${identifier}`, 240, 60 * 1000);
    return { success };
  },
};
