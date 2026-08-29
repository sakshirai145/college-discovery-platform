"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkAuth, saveComparison } from "@/lib/saved-client";

type SaveComparisonButtonProps = {
  collegeIds: string[];
};

export default function SaveComparisonButton({ collegeIds }: SaveComparisonButtonProps) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    checkAuth()
      .then((ok) => {
        if (!cancelled) setAuthed(ok);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setBusy(true);
    setState("idle");
    const result = await saveComparison(collegeIds);
    setBusy(false);
    if (result.ok) {
      setState("saved");
    } else if (result.status === 401) {
      setAuthed(false);
    } else {
      setState("error");
    }
  }

  if (authed === null) {
    return (
      <span className="inline-block h-9 w-40 animate-pulse rounded-lg bg-zinc-100" aria-hidden="true" />
    );
  }

  if (!authed) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-zinc-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Log in to save comparison
        </Link>
      </div>
    );
  }

  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
        Comparison saved
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-zinc-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="mr-1.5 h-4 w-4">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        {busy ? "Saving…" : "Save comparison"}
      </button>
      {state === "error" && (
        <span className="text-xs text-red-600">Couldn&apos;t save. Please try again.</span>
      )}
    </div>
  );
}
