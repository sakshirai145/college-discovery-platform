import Navbar from "@/components/Navbar";
import CollegeCardSkeleton from "@/components/CollegeCardSkeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 h-8 w-64 animate-pulse rounded bg-zinc-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CollegeCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
