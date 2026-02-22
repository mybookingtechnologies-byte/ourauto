import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function methodNotAllowed() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 });
}

export function GET() {
  return methodNotAllowed();
}

export function PUT() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

export function OPTIONS() {
  return methodNotAllowed();
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ success: false, error: "Token missing" }, { status: 400 });
    }

    const formBody = new URLSearchParams({
      secret,
      response: token,
    });

    const googleResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody.toString(),
      cache: "no-store",
    }).catch(() => null);

    if (!googleResponse || !googleResponse.ok) {
      return NextResponse.json({ success: false, error: "reCAPTCHA verification failed" }, { status: 401 });
    }

    const verification = (await googleResponse.json().catch(() => null)) as
      | {
          success?: boolean;
          score?: number;
        }
      | null;

    const success = verification?.success === true;
    const scoreValid = typeof verification?.score !== "number" || verification.score >= 0.5;

    if (!success || !scoreValid) {
      return NextResponse.json({ success: false, error: "reCAPTCHA verification failed" }, { status: 401 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: "Verification error" }, { status: 500 });
  }
}