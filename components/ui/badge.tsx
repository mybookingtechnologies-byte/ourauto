import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-2xl bg-yellow-500 px-2 py-1 text-xs font-semibold text-black", className)}
      {...props}
    />
  );
}
