export default function CollegeCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-200" />
      </div>
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-zinc-200" />
      <div className="mt-4 border-t border-zinc-100 pt-3">
        <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
        <div className="mt-1 h-4 w-24 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  );
}
