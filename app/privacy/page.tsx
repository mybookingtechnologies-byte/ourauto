export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="app-shell py-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <div className="card mt-4 space-y-3 text-sm text-muted">
        <p>OurAuto processes dealer account and listing data to provide marketplace services.</p>
        <p>
          We collect only data required to operate core features including authentication, listing
          publication, duplicate detection, and security monitoring.
        </p>
        <p>
          Security and abuse-prevention logs may be retained for operational and compliance
          purposes.
        </p>
        <p>
          For privacy requests, contact us at <a href="mailto:support@ourauto.app">support@ourauto.app</a>.
        </p>
      </div>
    </main>
  );
}