import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { inquirySchema } from "@/lib/validators";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const allowed = checkRateLimit(`inquiry:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many inquiries" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid inquiry data" }, { status: 400 });
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
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
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

  return NextResponse.json({ ok: true });
}
