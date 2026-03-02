import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export type SessionUser = {
  userId: string;
  role: "DEALER" | "ADMIN";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get("ourauto_token")?.value;
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
