import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditAction =
  | "ADMIN_APPROVE_DEALER"
  | "ADMIN_REJECT_DEALER"
  | "ADMIN_DELETE_CAR"
  | "ADMIN_FEATURE_CAR"
  | "DEALER_CREATE_CAR"
  | "DEALER_UPDATE_CAR"
  | "DEALER_MARK_CAR_SOLD"
  | "DEALER_DELETE_CAR"
  | "DEALER_UPDATE_PROFILE"
  | "DEALER_CHANGE_PASSWORD"
  | "SYSTEM_WEBHOOK_PAYMENT"
  | "SYSTEM_QUEUE_JOB"
  | "EXPERIMENT_CONVERSION";

type AuditInput = {
  actorUserId?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    },
  });
}
