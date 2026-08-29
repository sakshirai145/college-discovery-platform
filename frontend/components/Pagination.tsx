import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  query: string;
  basePath?: string;
};

export default function Pagination({ page, totalPages, query, basePath = "/" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams(query);
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400">
          Previous
        </span>
      )}

      <span className="px-3 py-2 text-sm text-zinc-600">
        Page <span className="font-semibold text-zinc-900">{page}</span> of {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400">
          Next
        </span>
      )}
    </nav>
  );
}
