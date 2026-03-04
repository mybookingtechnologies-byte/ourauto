import { NextResponse } from "next/server";
import { checkQueueHealth } from "@/lib/queue";
import { withApiHandler } from "@/lib/api";
import { measureExecution } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { prismaReplica } from "@/lib/prismaReplica";
import { redis } from "@/lib/redis";
import { tracer } from "@/lib/tracer";

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const startedAt = Date.now();
  const span = tracer.startSpan("health.check");
  try {
    let dbPrimary = false;
    let dbReplica = false;
    let redisReady = false;
    let queueReady = false;

    await prisma.$queryRaw`SELECT 1`;
    dbPrimary = true;
    try {
      if (prismaReplica) {
        await prismaReplica.$queryRaw`SELECT 1`;
        dbReplica = true;
      } else {
        dbReplica = true;
      }
    } catch {
      dbReplica = false;
    }

    try {
      await redis?.ping();
      redisReady = Boolean(redis);
    } catch {
      redisReady = false;
    }

    queueReady = await checkQueueHealth();

    const healthy = dbPrimary && dbReplica;

    const response = NextResponse.json({
      status: healthy ? "ok" : "degraded",
      dbPrimary,
      dbReplica,
      redis: redisReady,
      queue: queueReady,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      region: process.env.VERCEL_REGION || process.env.APP_REGION || "unknown",
      success: healthy,
      checks: {
        dbPrimary,
        dbReplica,
        redis: redisReady,
        queue: queueReady,
      },
      timestamp: new Date().toISOString(),
    }, { status: healthy ? 200 : 503 });

    measureExecution("health.check", startedAt, {
      status: healthy ? "ok" : "degraded",
      dbPrimary,
      dbReplica,
      redis: redisReady,
      queue: queueReady,
    });

    return response;
  } catch {
    const response = NextResponse.json({
      status: "degraded",
      dbPrimary: false,
      dbReplica: false,
      redis: false,
      queue: false,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      region: process.env.VERCEL_REGION || process.env.APP_REGION || "unknown",
      success: false,
      checks: {
        dbPrimary: false,
        dbReplica: false,
        redis: false,
        queue: false,
      },
      timestamp: new Date().toISOString(),
    }, { status: 503 });

    measureExecution("health.check", startedAt, { status: "degraded" });

    return response;
  } finally {
    span.end();
  }
});
