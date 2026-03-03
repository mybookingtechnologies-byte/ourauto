import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

const ADMIN_EMAIL = requireEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
const ADMIN_MOBILE = requireEnv("BOOTSTRAP_ADMIN_MOBILE");
const ADMIN_PASSWORD = requireEnv("BOOTSTRAP_ADMIN_PASSWORD");

const DEALER_EMAIL = requireEnv("BOOTSTRAP_DEALER_EMAIL").toLowerCase();
const DEALER_MOBILE = requireEnv("BOOTSTRAP_DEALER_MOBILE");
const DEALER_PASSWORD = requireEnv("BOOTSTRAP_DEALER_PASSWORD");

const TEST_CAR = {
  title: "2019 Hyundai i20 Sportz",
  brand: "Hyundai",
  model: "i20",
  year: 2019,
  km: 42000,
  fuel: "PETROL" as const,
  ownerCount: 1,
  price: "525000",
  city: "Ahmedabad",
  status: "ACTIVE" as const,
  isActive: true,
};

const TEST_CAR_IMAGES = [
  "https://images.unsplash.com/photo-1549921296-3a6b6f9f5f9a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
];

async function createAdminIfMissing() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: ADMIN_EMAIL }, { mobile: ADMIN_MOBILE }],
    },
    select: {
      id: true,
      email: true,
      mobile: true,
      role: true,
      status: true,
    },
  });

  if (existing) {
    console.log(
      `[SKIP] Admin exists: email=${existing.email}, mobile=${existing.mobile}, role=${existing.role}, status=${existing.status}`,
    );
    return existing;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      mobile: ADMIN_MOBILE,
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
    select: {
      id: true,
      email: true,
      mobile: true,
      role: true,
      status: true,
    },
  });

  console.log(`[OK] Admin created: email=${admin.email}`);
  return admin;
}

async function createDealerIfMissing() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: DEALER_EMAIL }, { mobile: DEALER_MOBILE }],
    },
    select: {
      id: true,
      email: true,
      mobile: true,
      role: true,
      status: true,
    },
  });

  if (existing) {
    if (existing.role !== "DEALER" || existing.status !== "APPROVED") {
      console.log(
        `[SKIP] Dealer identifier already in use by role=${existing.role}, status=${existing.status}. No changes made.`,
      );
    } else {
      console.log(`[SKIP] Dealer exists and approved: email=${existing.email}`);
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(DEALER_PASSWORD, BCRYPT_ROUNDS);
  const dealer = await prisma.user.create({
    data: {
      email: DEALER_EMAIL,
      mobile: DEALER_MOBILE,
      passwordHash,
      role: "DEALER",
      status: "APPROVED",
    },
    select: {
      id: true,
      email: true,
      mobile: true,
      role: true,
      status: true,
    },
  });

  console.log(`[OK] Dealer created: email=${dealer.email}`);
  return dealer;
}

async function createTestCarIfMissing(dealerId: string) {
  const existingCar = await prisma.car.findFirst({
    where: {
      dealerId,
      title: TEST_CAR.title,
      brand: TEST_CAR.brand,
      model: TEST_CAR.model,
      year: TEST_CAR.year,
    },
    select: { id: true, title: true },
  });

  if (existingCar) {
    console.log(`[SKIP] Test car already exists: ${existingCar.title}`);
    return existingCar;
  }

  const car = await prisma.car.create({
    data: {
      dealerId,
      title: TEST_CAR.title,
      brand: TEST_CAR.brand,
      model: TEST_CAR.model,
      year: TEST_CAR.year,
      km: TEST_CAR.km,
      fuel: TEST_CAR.fuel,
      ownerCount: TEST_CAR.ownerCount,
      price: TEST_CAR.price,
      city: TEST_CAR.city,
      status: TEST_CAR.status,
      isActive: TEST_CAR.isActive,
      media: {
        create: TEST_CAR_IMAGES.map((url, index) => ({
          url,
          order: index,
          isMain: index === 0,
        })),
      },
    },
    select: { id: true, title: true },
  });

  console.log(`[OK] Test car created: ${car.title}`);
  return car;
}

async function main() {
  console.log("[START] Bootstrapping production data...");

  await createAdminIfMissing();
  const dealer = await createDealerIfMissing();

  if (dealer.role === "DEALER") {
    await createTestCarIfMissing(dealer.id);
  } else {
    console.log("[SKIP] Test car not created because dealer account was not available.");
  }

  console.log("[DONE] Bootstrap script completed successfully.");
}

main()
  .catch((error) => {
    console.error("[ERROR] Bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
