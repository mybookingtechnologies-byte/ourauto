export default function Page(): JSX.Element {
  return (
    <main className="bg-bgPrimary px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <section className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
          <h1 className="text-2xl font-bold">About OurAuto</h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            OurAuto is a dealer-only B2B used car marketplace built for verified automotive businesses.
            The platform is not public and is designed to support trusted transactions between professionals.
            Access is limited to approved dealers to keep the marketplace secure and high quality.
          </p>
        </section>

        <section className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Why Dealer Only?</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-zinc-600 dark:text-zinc-300">
            <li>Secure transactions</li>
            <li>Verified inventory</li>
            <li>No public noise</li>
            <li>Business-focused platform</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Vision</h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            We are building the most reliable digital trading network for professional used-car dealers,
            with faster discovery, clearer trust signals, and tools that help businesses grow sustainably.
          </p>
        </section>
      </div>
    </main>
  );
}
