import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiError, apiSuccess, getClientIp, withApiHandler } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rateLimit";
import { inquirySchema } from "@/lib/validators";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`inquiry:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return rateLimitExceededResponse();
  }

  const body = await request.json();
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid inquiry data", 400);
  }

  const car = await prisma.car.findFirst({
    where: { id: parsed.data.carId, isActive: true },
    include: {
      dealer: {
        select: {
          email: true,
          businessName: true,
        },
      },
    },
  });

  if (!car) {
    return apiError("Car not found", 404);
  }

  await prisma.inquiry.create({
    data: {
      carId: parsed.data.carId,
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      message: parsed.data.message,
    },
  });

  if (resend) {
    await resend.emails.send({
      from: "OurAuto <noreply@ourauto.local>",
      to: [car.dealer.email],
      subject: `New inquiry for ${car.brand} ${car.model}`,
      html: `<p>Name: ${parsed.data.name}</p><p>Mobile: ${parsed.data.mobile}</p><p>Message: ${parsed.data.message}</p>`,
    });
  }

  return apiSuccess({});
});
