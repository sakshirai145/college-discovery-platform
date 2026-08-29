"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCollegeById } from "@/lib/api-client";
import { getSelectedIds } from "@/components/AddToCompare";

const MAX_COMPARE = 3;

export default function CompareSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selected = getSelectedIds(searchParams);
  const [names, setNames] = useState<Record<string, string>>({});
  const selectedKey = selected.join(",");

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      selected.map(async (id) => {
        const college = await fetchCollegeById(id);
        return { id, name: college ? college.name : "" };
      })
    )
      .then((resolved) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        resolved.forEach(({ id, name }) => {
          next[id] = name;
        });
        setNames(next);
      })
      .catch(() => {
        if (!cancelled) setNames({});
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  if (selected.length === 0) return null;

  function remove(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = selected.filter((s) => s !== id);
    if (next.length === 0) params.delete("ids");
    else params.set("ids", next.join(","));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ids");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }

  const atMax = selected.length >= MAX_COMPARE;
  const canCompare = selected.length >= 2 && selected.length <= MAX_COMPARE;
  const compareHref = `/compare?ids=${encodeURIComponent(selected.join(","))}`;

  return (
    <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {selected.length} of {MAX_COMPARE} colleges selected
          </p>
          {atMax && (
            <p className="mt-0.5 text-sm text-amber-700">
              Maximum of {MAX_COMPARE} colleges can be compared.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href={compareHref}
            aria-disabled={!canCompare}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              canCompare
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-zinc-200 text-zinc-500"
            }`}
          >
            Compare {selected.length} college{selected.length === 1 ? "" : "s"} →
          </Link>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Clear all
          </button>
        </div>
      </div>

      {selected.length < 2 && (
        <p className="mt-3 text-sm text-zinc-600">
          Select at least 2 colleges to compare. {2 - selected.length} more{" "}
          {2 - selected.length === 1 ? "college" : "colleges"} needed.
        </p>
      )}

      <ul
        className="mt-3 flex gap-2 overflow-x-auto pb-1"
        aria-label="Colleges selected for comparison"
      >
        {selected.map((id, index) => (
          <li
            key={id}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-indigo-200 bg-white py-1 pl-3 pr-1 text-sm text-zinc-900"
          >
            <span className="text-xs font-medium text-zinc-400">{index + 1}</span>
            <span className="max-w-[12rem] truncate">{names[id] || "…"}</span>
            <button
              type="button"
              onClick={() => remove(id)}
              aria-label={`Remove ${names[id] || "college"} from compare`}
              className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
