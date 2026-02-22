export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <main className="app-shell py-6">
      <h1 className="text-2xl font-bold">Terms &amp; Conditions</h1>
      <div className="card mt-4 space-y-3 text-sm text-muted">
        <p>OurAuto is a dealer-only platform for listing and discovery of vehicles.</p>
        <p>
          Users are responsible for lawful use, accurate listing details, and compliance with local
          vehicle trade regulations.
        </p>
        <p>
          Automated abuse controls (including rate limiting, reCAPTCHA, and duplicate checks) are
          enforced to protect platform integrity.
        </p>
        <p>
          Accounts may be restricted for suspicious or non-compliant activity to maintain platform
          safety.
        </p>
      </div>
    </main>
  );
}