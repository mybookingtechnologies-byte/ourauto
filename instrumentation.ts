import * as Sentry from "@sentry/nextjs";
import { runBootEnvChecks } from "@/lib/startup";
import { logError, logInfo } from "@/lib/observability";

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logInfo("sentry_disabled", { reason: "SENTRY_DSN_MISSING" });
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }

      return event;
    },
  });
}

export async function register() {
  runBootEnvChecks();
  initSentry();
  try {
    (globalThis as { addEventListener?: (name: string, callback: (event: PromiseRejectionEvent) => void) => void }).addEventListener?.("unhandledrejection", (event) => {
      logError("unhandled_rejection", event.reason);
      Sentry.captureException(event.reason);
    });
  } catch {
    // no-op on runtimes without event hooks
  }
}
