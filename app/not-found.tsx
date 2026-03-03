import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound(): JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-bgPrimary px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-2xl bg-bgSecondary p-6 text-center shadow-lg">
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
