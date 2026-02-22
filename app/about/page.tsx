export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="app-shell py-6">
      <h1 className="text-2xl font-bold">About OurAuto</h1>
      <div className="card mt-4 space-y-3 text-sm text-muted">
        <p>
          OurAuto is a hardened B2B marketplace for verified vehicle dealers to publish, discover,
          and transact listings with built-in safety controls.
        </p>
        <p>
          The platform focuses on operational trust with duplicate prevention, abuse controls, and
          auditable system logging.
        </p>
      </div>
    </main>
  );
}