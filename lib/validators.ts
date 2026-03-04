import { z } from "zod";

const cleanString = (value: string): string =>
  value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const signupSchema = z.object({
  dealerName: z.string().min(2).transform(cleanString),
  businessName: z.string().min(2).transform(cleanString),
  mobile: z.string().regex(/^[0-9]{10}$/),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(8),
  referralCode: z.string().min(4).max(64).transform((v) => v.trim().toUpperCase()).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(3).transform(cleanString),
  password: z.string().min(8),
});

export const inquirySchema = z.object({
  carId: z.string().uuid(),
  name: z.string().min(2).transform(cleanString),
  mobile: z.string().regex(/^[0-9]{10}$/),
  message: z.string().min(3).max(500).transform(cleanString),
});

export const createCarSchema = z.object({
  title: z.string().min(3).transform(cleanString),
  description: z.string().max(2000).optional(),
  brand: z.string().min(2).transform(cleanString),
  model: z.string().min(1).transform(cleanString),
  year: z.coerce.number().int().min(1980).max(2100),
  km: z.coerce.number().int().min(0),
  fuel: z.enum(["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "OTHER"]),
  ownerCount: z.coerce.number().int().min(0).max(10).optional(),
  price: z.coerce.number().positive(),
  city: z.string().min(2).transform(cleanString),
  isUrgent: z.coerce.boolean().optional(),
  plateNumber: z.string().optional(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        order: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  message: z.string().min(1).max(2000).transform(cleanString),
});

export const dealerCarPatchSchema = z
  .object({
    action: z.enum(["sold"]).optional(),
    title: z.string().min(3).transform(cleanString).optional(),
    city: z.string().min(2).transform(cleanString).optional(),
    price: z.coerce.number().positive().optional(),
  })
  .refine((data) => data.action === "sold" || data.title !== undefined || data.city !== undefined || data.price !== undefined, {
    message: "Invalid update payload",
  });

export const chatRoomCreateSchema = z.object({
  targetDealerId: z.string().uuid(),
});

export const adminDealerStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const adminCarActionSchema = z.object({
  carId: z.string().uuid(),
  action: z.enum(["DELETE", "FEATURE"]),
});

export const adminSubscriptionCreateSchema = z.object({
  userId: z.string().uuid(),
  planName: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  amount: z.coerce.number().positive(),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const adminSubscriptionUpdateSchema = z.object({
  id: z.string().uuid(),
  planName: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
  amount: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const dealerProfileUpdateSchema = z.object({
  dealerName: z.string().min(2).transform(cleanString).optional(),
  businessName: z.string().min(2).transform(cleanString).optional(),
  city: z.string().min(2).transform(cleanString).optional(),
  profileImage: z
    .string()
    .refine((value) => /^https:\/\/res\.cloudinary\.com\//i.test(value), "Invalid image URL")
    .optional(),
  coverImage: z
    .string()
    .refine((value) => /^https:\/\/res\.cloudinary\.com\//i.test(value), "Invalid image URL")
    .optional(),
  bio: z.string().max(500).transform(cleanString).optional(),
});

export const dealerPasswordUpdateSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const adminSettingsUpdateSchema = z.object({
  maxImages: z.coerce.number().int().min(1).max(30).optional(),
  autoExpireDays: z.coerce.number().int().min(1).max(365).optional(),
});

export const dealerPromotionActivateSchema = z.object({
  carId: z.string().uuid(),
});

export const dealerPackagePurchaseSchema = z.object({
  packageId: z.string().uuid(),
});

export const adminPackageCreateSchema = z.object({
  name: z.string().min(2).max(100).transform(cleanString),
  type: z.enum(["HOT_DEAL", "FUTURE_AD"]),
  credits: z.coerce.number().int().min(1),
  price: z.coerce.number().int().min(0),
  isActive: z.boolean().optional(),
});

export const adminPackageUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).transform(cleanString).optional(),
  credits: z.coerce.number().int().min(1).optional(),
  price: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const adminPlatformConfigSchema = z.object({
  hotDealMilestone: z.coerce.number().int().min(1).optional(),
  referralReward: z.coerce.number().int().min(1).optional(),
});

export function parseWhatsappDetails(input: string): Partial<z.infer<typeof createCarSchema>> {
  const text = input.toUpperCase();
  const get = (regex: RegExp): string | undefined => {
    const match = text.match(regex);
    return match?.[1]?.trim();
  };

  const year = get(/YEAR[:\-\s]*([0-9]{4})/);
  const km = get(/KM[:\-\s]*([0-9,]+)/);
  const owner = get(/OWNER[:\-\s]*([0-9])/);
  const price = get(/PRICE[:\-\s]*([0-9,]+)/);

  return {
    brand: get(/BRAND[:\-\s]*([A-Z0-9 ]+)/),
    model: get(/MODEL[:\-\s]*([A-Z0-9 ]+)/),
    year: year ? Number(year) : undefined,
    km: km ? Number(km.replace(/,/g, "")) : undefined,
    fuel: (get(/FUEL[:\-\s]*(PETROL|DIESEL|CNG|ELECTRIC|HYBRID)/) as
      | "PETROL"
      | "DIESEL"
      | "CNG"
      | "ELECTRIC"
      | "HYBRID"
      | undefined) || "OTHER",
    ownerCount: owner ? Number(owner) : undefined,
    price: price ? Number(price.replace(/,/g, "")) : undefined,
    city: get(/CITY[:\-\s]*([A-Z ]+)/),
  };
}
