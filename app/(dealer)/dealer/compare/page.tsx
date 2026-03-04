import Link from "next/link";
import { assignVariant } from "@/lib/experiment";
import { isFeatureEnabled } from "@/lib/featureFlag";
import { readDb } from "@/lib/prismaReplica";
import { getSessionUser } from "@/lib/session";

interface Props {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ComparePage({ searchParams }: Props): Promise<JSX.Element> {
  const session = await getSessionUser();
  const idsParam = searchParams?.ids;
  const rawIds = Array.isArray(idsParam) ? idsParam[0] : idsParam;
  const ids = (rawIds || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);

  const cars = ids.length
    ? await readDb.car.findMany({
        where: {
          id: { in: ids },
          isActive: true,
          status: "ACTIVE",
          dealer: { role: "DEALER", status: "APPROVED" },
        },
      })
    : [];

  const useExperimentedUi = session
    ? await isFeatureEnabled("NEW_COMPARE_UI", session.userId)
    : false;
  const variant = useExperimentedUi && session
    ? (await assignVariant("NEW_COMPARE_UI", session.userId)) || "A"
    : "A";

  return (
    <div className="mx-auto max-w-6xl py-10">
      <h1 className="mb-10 text-3xl font-bold">
        Compare Vehicles {useExperimentedUi ? `(Variant ${variant})` : ""}
      </h1>

      {cars.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-300">
          Select vehicles to compare from a car detail page.
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          {cars.map((car) => (
            <div key={car.id} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-xl font-bold">
                {car.year} {car.title}
              </h2>

              <p className="font-bold text-yellow-400">₹{Number(car.price).toLocaleString("en-IN")}</p>

              <p>{car.km} km</p>
              <p>{car.fuel}</p>
              <p>{car.city}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/dealer/marketplace" className="text-sm text-yellow-400 hover:text-yellow-300">
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
