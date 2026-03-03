import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export function Header(): JSX.Element {
  return (
    <header className="border-b border-zinc-200 bg-bgPrimary dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          OurAuto
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          <Link href="/login" className="rounded-2xl bg-bgSecondary px-3 py-2">
            Login
          </Link>
          <Link href="/signup" className="rounded-2xl bg-accent px-3 py-2 font-semibold text-black">
            Dealer Signup
          </Link>
        </nav>
      </div>
    </header>
  );
}
