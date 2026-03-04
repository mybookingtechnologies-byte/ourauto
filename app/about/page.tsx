import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dealer Marketplace | OurAuto",
  description: "Verified B2B used car marketplace for professional dealers.",
  openGraph: {
    title: "Dealer Marketplace | OurAuto",
    description: "India’s trusted dealer-only wholesale car network.",
    url: "https://ourauto.in",
    siteName: "OurAuto",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page(): JSX.Element {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6 transition-all duration-300">
          <h1 className="text-2xl font-bold">About OurAuto</h1>
          <p className="text-zinc-300">
            OurAuto is a dealer-only B2B automotive platform designed for verified dealers and professional trading.
            We focus on trust-first inventory exchange, faster deal discovery, and structured workflows for growing auto businesses.
            This ecosystem is intentionally closed to public buyers to protect quality and transactional reliability.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6 transition-all duration-300">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="text-zinc-300">
            Our mission is to build India’s most dependable digital B2B auto network where verified dealers can source, list,
            and close transactions with transparency, speed, and confidence.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6 transition-all duration-300">
          <h2 className="text-xl font-semibold">Technology</h2>
          <ul className="list-inside list-disc space-y-2 text-zinc-300">
            <li>Secure auth</li>
            <li>Verified onboarding</li>
            <li>Smart listing engine</li>
            <li>Real-time chat</li>
            <li>High-performance infra</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6 transition-all duration-300">
          <h2 className="text-xl font-semibold">What We Do NOT Do</h2>
          <ul className="list-inside list-disc space-y-2 text-zinc-300">
            <li>No public buyers</li>
            <li>No C2C</li>
            <li>No fake accounts</li>
            <li>No spam listings</li>
            <li>No unverified dealers</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6 transition-all duration-300">
          <h2 className="text-xl font-semibold">Policy</h2>
          <ul className="list-inside list-disc space-y-2 text-zinc-300">
            <li>Mandatory verification</li>
            <li>Genuine data required</li>
            <li>No misleading pricing</li>
            <li>No duplicates</li>
            <li>Compliance monitoring</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-6 transition-all duration-300">
          <h2 className="text-xl font-semibold">Customer Care</h2>
          <div className="space-y-1 text-zinc-300">
            <p>Mobile: 9408000012</p>
            <p>Working Hours:</p>
            <p>Mon–Sat</p>
            <p>10:00 AM – 7:00 PM</p>
          </div>
          <div>
            <p className="mb-2 text-zinc-300">Support includes:</p>
            <ul className="list-inside list-disc space-y-2 text-zinc-300">
              <li>Onboarding</li>
              <li>Listing help</li>
              <li>Account issues</li>
              <li>Technical support</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
