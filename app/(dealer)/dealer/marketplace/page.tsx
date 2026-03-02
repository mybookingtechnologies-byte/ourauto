import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DealerMarketplacePage(): Promise<JSX.Element> {
  const session = await getSessionUser();
  if (!session) {
    return <main className="p-6">Unauthorized</main>;
  }

  const count = await prisma.car.count({ where: { dealerId: session.userId } });
  if (count < 3) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6 py-12">
        <div className="rounded-2xl bg-bgSecondary p-6 text-center shadow-lg">
          <h1 className="text-xl font-bold">Marketplace Locked</h1>
          <p className="mt-2">List minimum 3 cars to activate marketplace.</p>
          <Link href="/dealer/add-car" className="mt-4 inline-block rounded-2xl bg-accent px-4 py-2 font-semibold text-black">
            Add Car
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-2xl font-bold">Marketplace Active</h1>
      <p className="mt-2 text-zinc-500">You can now access dealer marketplace features.</p>
    </main>
  );
}
