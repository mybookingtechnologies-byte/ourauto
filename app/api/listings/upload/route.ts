import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { imageSize } from "image-size";
import { fail, ok } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { verifyCsrf } from "@/lib/csrf";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";
import { enqueueJob } from "@/lib/jobs/queue";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 4096;
const MAX_IMAGE_HEIGHT = 4096;

function getExtension(file: File) {
  const mime = file.type.toLowerCase();
  if (mime === "image/jpeg") {
    return "jpg";
  }

  if (mime === "image/png") {
    return "png";
  }

  if (mime === "image/webp") {
    return "webp";
  }

  return "";
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined;

  try {
    if (await isRateLimited(request, "listing-upload", 10, 60_000)) {
      return fail("Too many upload attempts. Try again shortly.", 429);
    }

    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return fail(csrf.reason || "Invalid CSRF token", 403);
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return fail("Unauthorized", 401);
    }

    const formData = await request.formData();
    const inputFiles = formData.getAll("images").filter((entry): entry is File => entry instanceof File);

    if (inputFiles.length === 0) {
      return fail("At least one image is required", 400);
    }

    if (inputFiles.length > MAX_FILES) {
      return fail("Maximum 10 images allowed", 400);
    }

    const totalUploadBytes = inputFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
      return fail("Total upload size exceeds 30 MB", 400);
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uploadedUrls: string[] = [];
    const uploadedFilePaths: string[] = [];
    let firstImageHash = "";

    for (let index = 0; index < inputFiles.length; index += 1) {
      const file = inputFiles[index];

      if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        return fail("Each image must be between 1 byte and 8 MB", 400);
      }

      const extension = getExtension(file);
      if (!extension) {
        return fail("Only JPG, PNG, WEBP images are allowed", 400);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const dimensions = imageSize(buffer);
      if (!dimensions.width || !dimensions.height) {
        return fail("Unable to read image dimensions", 400);
      }

      if (dimensions.width > MAX_IMAGE_WIDTH || dimensions.height > MAX_IMAGE_HEIGHT) {
        return fail(`Image dimensions exceed ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}`, 400);
      }

      const hash = crypto.createHash("md5").update(buffer).digest("hex");
      if (index === 0) {
        firstImageHash = hash;
      }

      const fileName = `${user.id}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${fileName}`);
      uploadedFilePaths.push(filePath);
    }

    const jobId = await enqueueJob("listing-media-analysis", {
      filePaths: uploadedFilePaths,
      dealerId: user.id,
      uploadedAt: new Date().toISOString(),
    });

    return ok({ success: true, jobId, images: uploadedUrls, firstImageHash, mainPhotoIndex: 0 }, 201);
  } catch (error) {
    logError("upload_listing_images_error", error, { requestId });
    return fail("Unable to upload images", 500);
  }
}
