import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-transparent bg-bgPrimary px-3 py-2 text-sm text-textColor outline-none ring-1 ring-zinc-300 focus:ring-2 focus:ring-accent dark:ring-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
