CREATE TABLE IF NOT EXISTS "AdminSetting" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Car_status_isActive_createdAt_idx" ON "Car"("status", "isActive", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Car_status_isActive_price_idx" ON "Car"("status", "isActive", "price");
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

INSERT INTO "AdminSetting" ("id", "key", "value")
VALUES ('platform-default', 'platform', '{"maxImages":10,"autoExpireDays":30}'::jsonb)
ON CONFLICT ("key") DO NOTHING;
