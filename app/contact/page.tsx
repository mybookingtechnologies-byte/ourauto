export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="app-shell py-6">
      <h1 className="text-2xl font-bold">Contact</h1>
      <div className="card mt-4 space-y-2 text-sm text-muted">
        <p>Email: <a href="mailto:support@ourauto.app">support@ourauto.app</a></p>
        <p>Business hours: Mon-Sat, 9:00 AM - 6:00 PM (IST)</p>
        <p>For urgent security issues, include &quot;Security&quot; in the subject line.</p>
      </div>
    </main>
  );
}