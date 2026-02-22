import type { DealerBadge } from "@/types/domain";

const styles: Record<DealerBadge, string> = {
  Basic: "bg-black/10 text-foreground dark:bg-white/10",
  Pro: "bg-accent text-black",
  Premium: "bg-black text-white dark:bg-white dark:text-black",
};

export function DealerBadgePill({ badge }: { badge: DealerBadge }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[badge]}`}>
      {badge}
    </span>
  );
}