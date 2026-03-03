import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set("ourauto_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
