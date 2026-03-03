import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, validateCsrf, withApiHandler } from "@/lib/api";
import { requireDealer } from "@/lib/apiAuth";
import { cloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

async function uploadToCloudinary(buffer: Buffer, userId: string, contentType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ourauto/dealers/${userId}`,
        resource_type: "image",
        format: contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
}

export const POST = withApiHandler(async (request: NextRequest): Promise<NextResponse> => {
  const csrfError = validateCsrf(request);
  if (csrfError) {
    return apiError(csrfError, 403);
  }

  const auth = await requireDealer();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError("File is required", 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return apiError("Only JPG, PNG, and WEBP files are allowed", 400);
  }

  if (file.size > MAX_SIZE_BYTES) {
    return apiError("File too large (max 5MB)", 400);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const url = await uploadToCloudinary(buffer, auth.userId, file.type);

  return apiSuccess({ url });
});
