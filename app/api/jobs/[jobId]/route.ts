import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";
import { logError } from "@/lib/observability";
import { getJobStatusForOwner } from "@/lib/jobs/status";

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    if (await isRateLimited(request, "job-status", 120, 60_000)) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    if (!jobId || jobId.length > 128) {
      return NextResponse.json({ success: false, error: "Invalid job id" }, { status: 400 });
    }

    const statusRecord = await getJobStatusForOwner(jobId, user.id);
    if (!statusRecord) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: statusRecord.status,
      ...(statusRecord.result ? { result: statusRecord.result } : {}),
    });
  } catch (error) {
    logError("job_status_get_error", error);
    return NextResponse.json({ success: false, error: "Unable to load job status" }, { status: 500 });
  }
}
