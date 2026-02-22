import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface OCRResult {
  registrationNumber: string | null;
  confidence: number;
}

function normalizePlate(raw: string) {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const match = cleaned.match(/[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4}/);
  return match?.[0] ?? null;
}

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const bytes = await request.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));

  const visionKey = Deno.env.get("GOOGLE_VISION_API_KEY");
  if (!visionKey) {
    return Response.json({ registrationNumber: null, confidence: 0 });
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    return Response.json({ registrationNumber: null, confidence: 0 }, { status: 502 });
  }

  const payload = await response.json();
  const text: string =
    payload?.responses?.[0]?.fullTextAnnotation?.text ??
    payload?.responses?.[0]?.textAnnotations?.[0]?.description ??
    "";

  const registrationNumber = normalizePlate(text);
  const result: OCRResult = {
    registrationNumber,
    confidence: registrationNumber ? 0.88 : 0,
  };

  return Response.json(result);
});