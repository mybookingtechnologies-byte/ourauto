import { PrismaClient } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { logError, logInfo } from "@/lib/observability";

declare global {
  var prisma: PrismaClient | undefined;
}

function withConnectionParams(url: string) {
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    return url;
  }

  const normalized = new URL(url);
  if (!normalized.searchParams.has("pgbouncer")) {
    normalized.searchParams.set("pgbouncer", "true");
  }

  if (!normalized.searchParams.has("statement_cache_size")) {
    normalized.searchParams.set("statement_cache_size", "0");
  }

  if (!normalized.searchParams.has("connect_timeout")) {
    normalized.searchParams.set("connect_timeout", "10");
  }

  if (!normalized.searchParams.has("pool_timeout")) {
    normalized.searchParams.set("pool_timeout", "15");
  }

  if (!normalized.searchParams.has("statement_timeout")) {
    normalized.searchParams.set("statement_timeout", "10000");
  }

  return normalized.toString();
}

const datasourceUrl = withConnectionParams(getEnv("DATABASE_URL"));

const prisma = global.prisma ?? new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
  ],
  datasources: {
    db: {
      url: datasourceUrl,
    },
  },
  transactionOptions: {
    maxWait: 5_000,
    timeout: 10_000,
  },
});

type PrismaQueryEvent = {
  duration?: number;
  target?: string;
  query?: string;
};

type PrismaErrorEvent = {
  message?: string;
  target?: string;
};

const prismaWithEvents = prisma as unknown as {
  $on: {
    (eventType: "query", callback: (event: PrismaQueryEvent) => void): void;
    (eventType: "error", callback: (event: PrismaErrorEvent) => void): void;
  };
};

prismaWithEvents.$on("query", (event) => {
  if (typeof event?.duration === "number" && event.duration >= 750) {
    logInfo("prisma_slow_query", {
      durationMs: event.duration,
      target: event.target,
      queryPreview: typeof event.query === "string" ? event.query.slice(0, 140) : "",
    });
  }
});

prismaWithEvents.$on("error", (event) => {
  logError("prisma_query_error", event?.message || "Unknown prisma error", {
    target: event?.target,
  });
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
