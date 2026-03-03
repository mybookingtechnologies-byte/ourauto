"use client";

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
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-bgPrimary px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-2xl bg-bgSecondary p-6 text-center shadow-lg">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-500">An unexpected error occurred. Please try again.</p>
        <Button className="mt-5" onClick={reset}>
          Try Again
        </Button>
      </div>
    </main>
  );
}
