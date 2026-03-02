import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-2xl border border-transparent bg-bgPrimary px-3 text-sm text-textColor outline-none ring-1 ring-zinc-300 focus:ring-2 focus:ring-accent dark:ring-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
