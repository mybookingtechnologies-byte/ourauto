import { ReactNode } from "react";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  children: ReactNode;
};

export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="relative z-10 w-full max-w-[420px] rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:p-7">
      <Link
        href="/"
        aria-label="Close"
        className="absolute right-4 top-4 text-zinc-500 transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] dark:text-zinc-400"
      >
        ✕
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      {children}
    </div>
  );
}