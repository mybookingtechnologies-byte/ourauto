import AddCar from "@/components/dealer/AddCar";
import Analytics from "@/components/dealer/Analytics";
import DashboardTabs, { DealerTabKey } from "@/components/dealer/DashboardTabs";
import Leads from "@/components/dealer/Leads";
import Listings from "@/components/dealer/Listings";
import Messages from "@/components/dealer/Messages";
import Overview from "@/components/dealer/Overview";
import Profile from "@/components/dealer/Profile";

type DealerPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

const validTabs: DealerTabKey[] = [
  "overview",
  "listings",
  "add-car",
  "leads",
  "messages",
  "profile",
  "analytics",
];

function getActiveTab(tab?: string): DealerTabKey {
  if (tab && validTabs.includes(tab as DealerTabKey)) {
    return tab as DealerTabKey;
  }

  return "overview";
}

function renderSection(tab: DealerTabKey) {
  switch (tab) {
    case "listings":
      return <Listings />;
    case "add-car":
      return <AddCar />;
    case "leads":
      return <Leads />;
    case "messages":
      return <Messages />;
    case "profile":
      return <Profile />;
    case "analytics":
      return <Analytics />;
    case "overview":
    default:
      return <Overview />;
  }
}

export default async function DealerPage({ searchParams }: DealerPageProps) {
  const params = await searchParams;
  const activeTab = getActiveTab(params?.tab);

  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] w-full max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Dealer Dashboard</h1>
      <DashboardTabs activeTab={activeTab} />
      {renderSection(activeTab)}
    </main>
  );
}
