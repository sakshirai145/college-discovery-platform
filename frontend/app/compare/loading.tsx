import Navbar from "@/components/Navbar";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-200" />
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    </div>
  );
}
