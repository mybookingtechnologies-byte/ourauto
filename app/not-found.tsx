import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound(): JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page Not Found</h1>
        <p className="mt-2 text-sm text-zinc-500">The page you are looking for does not exist.</p>
        <Link href="/" className="mt-5 inline-block">
          <Button>Go to Home</Button>
        </Link>
      </div>
    </main>
  );
}
