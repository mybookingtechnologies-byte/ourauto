import Link from "next/link";

export type DealerTabKey =
  | "overview"
  | "listings"
  | "add-car"
  | "leads"
  | "messages"
  | "profile"
  | "analytics";

const tabs: Array<{ key: DealerTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "listings", label: "My Listings" },
  { key: "add-car", label: "Add Car" },
  { key: "leads", label: "Leads" },
  { key: "messages", label: "Messages" },
  { key: "profile", label: "Profile" },
  { key: "analytics", label: "Analytics" },
];

type DashboardTabsProps = {
  activeTab: DealerTabKey;
};

export default function DashboardTabs({ activeTab }: DashboardTabsProps) {
  return (
    <nav className="rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Link
              key={tab.key}
              href={`/dealer?tab=${tab.key}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--primary-yellow)] !text-black"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}