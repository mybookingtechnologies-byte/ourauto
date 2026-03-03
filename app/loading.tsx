export default function Loading(): JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-accent dark:border-zinc-700" />
        <p className="mt-3 text-sm text-zinc-500">Loading...</p>
      </div>
    </main>
  );
}
