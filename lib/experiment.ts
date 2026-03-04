import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type ExperimentConfig = {
  active: boolean;
  variantA: string;
  variantB: string;
};

function getBucket(input: string): number {
  const hash = crypto.createHash("md5").update(input).digest("hex");
  return parseInt(hash.slice(0, 2), 16) % 2;
}

async function readExperiment(key: string): Promise<ExperimentConfig | null> {
  const record = await prisma.adminSetting.findUnique({
    where: { key: `experiment:${key}` },
    select: { value: true },
  });

  if (!record || typeof record.value !== "object" || record.value === null) {
    return null;
  }

  const raw = record.value as Record<string, unknown>;
  return {
    active: Boolean(raw.active),
    variantA: typeof raw.variantA === "string" ? raw.variantA : "A",
    variantB: typeof raw.variantB === "string" ? raw.variantB : "B",
  };
}

export async function assignVariant(key: string, userId: string): Promise<string | null> {
  const experiment = await readExperiment(key);
  if (!experiment || !experiment.active) {
    return null;
  }

  return getBucket(`${key}:${userId}`) === 0 ? experiment.variantA : experiment.variantB;
}

export async function trackExperimentConversion(input: {
  actorUserId?: string;
  key: string;
  variant: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "EXPERIMENT_CONVERSION",
    targetType: "Experiment",
    targetId: input.key,
    metadata: {
      variant: input.variant,
      ...(input.metadata || {}),
    },
  });
}
