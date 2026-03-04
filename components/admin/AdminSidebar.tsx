import Link from "next/link";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Dealers", href: "/admin/dealers" },
  { label: "Listings", href: "/admin/cars" },
  { label: "Subscriptions", href: "/admin/subscriptions" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminSidebar(): JSX.Element {
  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Admin Panel</h2>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-3 py-2 text-sm text-zinc-200 transition-all duration-300 hover:bg-zinc-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
