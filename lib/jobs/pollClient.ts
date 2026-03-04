import type { JobStatus } from "@/lib/jobs/status";

export type PolledJobStatus = {
  status: JobStatus;
  result?: Record<string, unknown>;
};

type PollJobStatusOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onUpdate?: (state: PolledJobStatus) => void;
};

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

export async function pollJobStatus(jobId: string, options: PollJobStatusOptions = {}) {
  const intervalMs = options.intervalMs ?? 1500;
  const timeoutMs = options.timeoutMs ?? 90_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
    });

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      if (response.status === 404) {
        await wait(intervalMs, options.signal);
        continue;
      }

      throw new Error("Unable to poll job status");
    }

    const payload = await response.json() as {
      success?: boolean;
      status?: JobStatus;
      result?: Record<string, unknown>;
    };

    if (!payload.success || !payload.status) {
      throw new Error("Invalid job status response");
    }

    const state: PolledJobStatus = {
      status: payload.status,
      result: payload.result,
    };

    options.onUpdate?.(state);

    if (state.status === "completed" || state.status === "failed") {
      return state;
    }

    await wait(intervalMs, options.signal);
  }

  throw new Error("Job polling timed out");
}
