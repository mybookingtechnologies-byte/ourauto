"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-zinc-500">An unexpected error occurred. Please try again.</p>
            <Button className="mt-5" onClick={reset}>
              Try Again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
