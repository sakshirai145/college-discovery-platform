"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AddToCompareProps = {
  collegeId: string;
  collegeName: string;
};

const MAX_COMPARE = 3;

export function getSelectedIds(searchParams: URLSearchParams): string[] {
  const raw = searchParams.getAll("ids").join(",");
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_COMPARE);
}

export default function AddToCompare({ collegeId, collegeName }: AddToCompareProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = getSelectedIds(searchParams);
  const isSelected = selected.includes(collegeId);
  const atMax = selected.length >= MAX_COMPARE;

  function apply(nextIds: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextIds.length === 0) params.delete("ids");
    else params.set("ids", nextIds.join(","));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleToggle() {
    if (isSelected) {
      apply(selected.filter((id) => id !== collegeId));
      return;
    }
    apply([...selected, collegeId]);
  }

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed="true"
        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Remove from compare
      </button>
    );
  }

  const disabled = atMax;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      aria-pressed="false"
      aria-label={disabled ? `Compare full: maximum of ${MAX_COMPARE} colleges reached` : `Add ${collegeName} to compare`}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-zinc-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-300 disabled:hover:bg-transparent disabled:hover:text-zinc-700"
    >
      {disabled ? "Compare full" : "Add to compare"}
    </button>
  );
}
