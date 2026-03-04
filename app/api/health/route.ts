import { NextResponse } from "next/server";
import { checkQueueHealth } from "@/lib/queue";
import { withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { prismaReplica } from "@/lib/prismaReplica";
import { redis } from "@/lib/redis";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  let dbPrimary = false;
  let dbReplica = false;
  let redisReady = false;
  let queueReady = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbPrimary = true;
  } catch {
    dbPrimary = false;
  }

  if (prismaReplica) {
    try {
      await prismaReplica.$queryRaw`SELECT 1`;
      dbReplica = true;
    } catch {
      dbReplica = false;
    }
  } else {
    dbReplica = true;
  }

  try {
    await redis?.ping();
    redisReady = Boolean(redis);
  } catch {
    redisReady = false;
  }

  queueReady = await checkQueueHealth();

  const healthy = dbPrimary && dbReplica;

  return NextResponse.json({
    success: healthy,
    status: healthy ? "ok" : "degraded",
    region: process.env.VERCEL_REGION || process.env.APP_REGION || "unknown",
    checks: {
      dbPrimary,
      dbReplica,
      redis: redisReady,
      queue: queueReady,
    },
    timestamp: new Date().toISOString(),
  }, { status: healthy ? 200 : 503 });
});
