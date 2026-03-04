import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dealerName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().regex(/^\d{10}$/),
  password: z.string().min(6).max(128),
  referralCode: z.string().trim().max(64).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
});

export const listingCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  price: z.number().int().positive(),
  city: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(3000),
  dealerId: z.string().trim().optional(),
  fuel: z.string().trim().max(40).nullable().optional(),
  km: z.number().int().min(0).max(999999).nullable().optional(),
  owner: z.string().trim().max(32).nullable().optional(),
  colour: z.string().trim().max(40).nullable().optional(),
  transmission: z.enum(["Manual", "Automatic"]).default("Manual"),
  insuranceType: z.string().trim().max(40).nullable().optional(),
  insuranceTill: z.string().trim().max(40).nullable().optional(),
  remarks: z.string().trim().max(500).nullable().optional(),
  images: z.array(z.string().trim().min(1)).min(3).max(10),
  plateNumber: z.string().trim().max(32).nullable().optional(),
  imageHash: z.string().trim().regex(/^[a-f0-9]{32}$/i).nullable().optional(),
  boostType: z.enum(["NORMAL", "HOT_DEAL", "FUTURE_AD"]).optional(),
  status: z.literal("LIVE").optional(),
});

export const dealerProfileSchema = z.object({
  dealerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\d{10}$/),
  city: z.string().trim().max(80).nullable().optional(),
  businessAddress: z.string().trim().max(180).nullable().optional(),
  aboutDealer: z.string().trim().max(500).nullable().optional(),
});

export const adminCreditsSchema = z.object({
  dealerId: z.string().trim().min(1),
  hotDealCredits: z.number().int().min(0).optional(),
  futureAdCredits: z.number().int().min(0).optional(),
});
