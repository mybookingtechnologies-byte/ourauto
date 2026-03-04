import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import Link from "next/link";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "OurAuto - Dealer Only Used Car Marketplace",
  description: "India’s trusted B2B used car marketplace for verified dealers.",
  openGraph: {
    title: "OurAuto",
    description: "Wholesale used car trading network for professionals.",
    type: "website",
  },
};

export default function PublicHomePage(): JSX.Element {
  return (
    <main>
      <Header />
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-400">Dealer-Only Network</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Wholesale Used Car Marketplace for Verified Dealers</h1>
            <p className="text-zinc-300">
              OurAuto helps professional dealers discover inventory, compare opportunities, and transact with confidence in a closed B2B environment.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="rounded-2xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-600">
                Dealer Login
              </Link>
              <Link href="/dealer-signup" className="rounded-2xl bg-zinc-800 px-4 py-2 text-zinc-100 hover:bg-zinc-700">
                Apply as Dealer
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-300">
            <p className="font-semibold text-zinc-100">Why OurAuto</p>
            <ul className="mt-3 list-inside list-disc space-y-2">
              <li>Verified dealer onboarding</li>
              <li>Structured listing visibility</li>
              <li>Secure inquiry workflows</li>
              <li>Fast marketplace discovery</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold">Verified Ecosystem</h2>
            <p className="mt-2 text-sm text-zinc-300">Only approved dealers can participate, reducing spam and improving trust signals.</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold">Built for B2B Speed</h2>
            <p className="mt-2 text-sm text-zinc-300">Optimized inventory views, compare flows, and direct communication pathways.</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-lg font-semibold">Dealer-Only Rules</h2>
            <p className="mt-2 text-sm text-zinc-300">No public buyers, no C2C noise, and strict quality-first compliance checks.</p>
          </article>
        </div>

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to Trade Better?</h2>
          <p className="mt-2 text-zinc-300">Join India’s trusted dealer-only wholesale car network.</p>
          <div className="mt-5">
            <Link href="/login" className="rounded-2xl bg-yellow-500 px-5 py-2 font-semibold text-black hover:bg-yellow-600">
              Continue to Dealer Login
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
