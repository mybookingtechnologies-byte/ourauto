import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { adminSettingsUpdateSchema } from "@/lib/validators";

let settingsStore = {
  maxImages: 10,
  autoExpireDays: 30,
};

export async function GET(): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  return NextResponse.json({ settings: settingsStore });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) {
    return admin;
  }

  const body = await request.json();
  const parsed = adminSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  settingsStore = {
    maxImages: parsed.data.maxImages ?? settingsStore.maxImages,
    autoExpireDays: parsed.data.autoExpireDays ?? settingsStore.autoExpireDays,
  };

  return NextResponse.json({ settings: settingsStore });
}
