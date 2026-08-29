import Navbar from "@/components/Navbar";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="h-9 w-64 animate-pulse rounded bg-zinc-200" />
            <div className="mt-3 h-5 w-48 animate-pulse rounded bg-zinc-200" />
            <div className="mt-6 h-40 animate-pulse rounded-2xl bg-zinc-100" />
            <div className="mt-6 h-4 w-full animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
          </div>
          <div className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
        </div>
        <div className="mt-10 h-4 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-32 animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    </div>
  );
}
