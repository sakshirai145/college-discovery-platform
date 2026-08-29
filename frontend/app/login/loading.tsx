import Navbar from "@/components/Navbar";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto h-8 w-48 max-w-md animate-pulse rounded bg-zinc-200" />
        <div className="mx-auto mt-6 h-80 w-full max-w-md animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    </div>
  );
}
