import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const SECRET = env.JWT_SECRET;
const encoder = new TextEncoder();

export type AuthTokenPayload = {
  userId: string;
  role: "DEALER" | "ADMIN";
};

export async function generateToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(SECRET));
}

export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(SECRET));
    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== "string") {
      return null;
    }
    if (role !== "DEALER" && role !== "ADMIN") {
      return null;
    }
    return { userId, role };
  } catch {
    return null;
  }
}
