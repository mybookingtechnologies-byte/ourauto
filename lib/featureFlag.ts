import { prisma } from "@/lib/prisma";

type FeatureFlagShape = {
  key: string;
  enabled: boolean;
  rollout?: number;
};

function clampRollout(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.floor(parsed)));
}

async function readFeatureFlag(key: string): Promise<FeatureFlagShape | null> {
  const record = await prisma.adminSetting.findUnique({
    where: { key: `feature_flag:${key}` },
    select: { value: true },
  });

  if (!record || typeof record.value !== "object" || record.value === null) {
    return null;
  }

  const raw = record.value as Record<string, unknown>;
  return {
    key,
    enabled: Boolean(raw.enabled),
    rollout: clampRollout(raw.rollout),
  };
}

export async function isFeatureEnabled(key: string, identifier?: string): Promise<boolean> {
  const flag = await readFeatureFlag(key);
  if (!flag || !flag.enabled) {
    return false;
  }

  const rollout = flag.rollout ?? 100;
  if (rollout >= 100) {
    return true;
  }
  if (!identifier) {
    return false;
  }

  let hash = 0;
  for (let index = 0; index < identifier.length; index += 1) {
    hash = (hash * 31 + identifier.charCodeAt(index)) % 10000;
  }
  const bucket = hash % 100;
  return bucket < rollout;
}
