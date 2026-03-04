import Link from "next/link";

export function Settings(): JSX.Element {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-xl font-semibold">Settings</h2>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/settings" className="rounded-2xl bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-all duration-300 hover:bg-zinc-700">
          Open Admin Settings
        </Link>
        <Link href="/admin/subscriptions" className="rounded-2xl bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-all duration-300 hover:bg-zinc-700">
          Manage Subscriptions
        </Link>
      </div>
    </section>
  );
}
