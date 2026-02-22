import "server-only";

type RecaptchaVerifyResponse = {
  success?: boolean;
  score?: number;
};

export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  try {
    if (process.env.NEXT_RUNTIME === "edge") {
      return false;
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const normalizedToken = token.trim();

    if (!secret || !normalizedToken) {
      return false;
    }

    const body = new URLSearchParams({
      secret,
      response: normalizedToken,
    });

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as RecaptchaVerifyResponse;
    if (result.success !== true) {
      return false;
    }

    if (typeof result.score === "number" && result.score < 0.5) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}