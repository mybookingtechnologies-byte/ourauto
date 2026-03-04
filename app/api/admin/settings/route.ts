import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { adminSettingsUpdateSchema } from "@/lib/validators";

const defaultSettings = {
  maxImages: 10,
  autoExpireDays: 30,
};

async function getSettings(): Promise<typeof defaultSettings> {
  const record = await prisma.adminSetting.findUnique({ where: { key: "platform" } });
  if (!record) {
    await prisma.adminSetting.create({
      data: {
        key: "platform",
        value: defaultSettings,
      },
    });
    return defaultSettings;
  }

  const value = record.value as Partial<typeof defaultSettings>;
  return {
    maxImages: value.maxImages ?? defaultSettings.maxImages,
    autoExpireDays: value.autoExpireDays ?? defaultSettings.autoExpireDays,
  };
}

export const GET = withApiHandler(async (): Promise<NextResponse> => {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const settings = await getSettings();
  return apiSuccess({ settings });
});

export const PATCH = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const allowed = await checkRateLimit(`admin:${admin.userId}`, 30, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const body = await request.json();
  const parsed = adminSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid payload", 400);
  }

  const current = await getSettings();
  const nextSettings = {
    maxImages: parsed.data.maxImages ?? current.maxImages,
    autoExpireDays: parsed.data.autoExpireDays ?? current.autoExpireDays,
  };

  await prisma.adminSetting.upsert({
    where: { key: "platform" },
    update: { value: nextSettings },
    create: { key: "platform", value: nextSettings },
  });

  return apiSuccess({ settings: nextSettings });
});
