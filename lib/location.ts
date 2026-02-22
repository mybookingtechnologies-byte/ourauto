import { headers } from "next/headers";

export async function getRequestLocation() {
  const headerStore = await headers();
  const city = headerStore.get("x-vercel-ip-city") ?? "Unknown City";
  const state = headerStore.get("x-vercel-ip-country-region") ?? "Unknown State";
  return { city, state };
}