import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

declare global {
  // eslint-disable-next-line no-var
  var prismaReplica: PrismaClient | undefined;
}

const replicaUrl = process.env.DATABASE_REPLICA_URL;

const replicaClient = replicaUrl
  ? global.prismaReplica ||
    new PrismaClient({
      datasources: {
        db: {
          url: replicaUrl,
        },
      },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  : null;

if (process.env.NODE_ENV !== "production" && replicaClient) {
  global.prismaReplica = replicaClient;
}

export const prismaReplica = replicaClient;
export const readDb = prismaReplica || prisma;
