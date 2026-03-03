import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, getClientIp, withApiHandler } from "@/lib/api";
import { getPlatformConfig } from "@/lib/promotion";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { signupSchema } from "@/lib/validators";

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `OA${randomBytes(4).toString("hex")}`.toUpperCase();
    const existing = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!existing) {
      return code;
    }
  }

  return `OA${randomBytes(8).toString("hex")}`.toUpperCase();
}

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return apiError("Too many signup attempts", 429);
  }

  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid signup data", 400);
  }

  const exists = await prisma.user.findFirst({
    where: {
      OR: [{ email: parsed.data.email }, { mobile: parsed.data.mobile }],
    },
  });

  if (exists) {
    return apiError("Email or mobile already exists", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const referralCode = await generateUniqueReferralCode();
  const createdUser = await prisma.user.create({
    data: {
      dealerName: parsed.data.dealerName,
      businessName: parsed.data.businessName,
      email: parsed.data.email,
      mobile: parsed.data.mobile,
      passwordHash,
      role: "DEALER",
      status: "PENDING",
      referralCode,
      referredBy: null,
    },
  });

  const enteredReferralCode = parsed.data.referralCode;
  if (enteredReferralCode) {
    try {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: enteredReferralCode },
        select: { id: true, role: true, status: true },
      });

      if (referrer && referrer.role === "DEALER" && referrer.status === "APPROVED") {
        const platformConfig = await getPlatformConfig();
        await prisma.user.update({
          where: { id: createdUser.id },
          data: { referredBy: enteredReferralCode },
        });
        await prisma.user.update({
          where: { id: referrer.id },
          data: {
            futureAdCredits: {
              increment: platformConfig.referralReward,
            },
          },
        });
      }
    } catch {}
  }

  return apiSuccess({});
});
