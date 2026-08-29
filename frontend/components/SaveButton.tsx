"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkAuth, fetchSaveStatusBatched, saveCollege, unsaveCollege } from "@/lib/saved-client";

type SaveButtonProps = {
  collegeId: string;
  initialSaved?: boolean;
};

export default function SaveButton({ collegeId, initialSaved }: SaveButtonProps) {
  const [authState, setAuthState] = useState<"loading" | "authed" | "anon">("loading");
  const [saved, setSaved] = useState<boolean>(Boolean(initialSaved));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const authed = await checkAuth();
      if (cancelled) return;
      if (!authed) {
        setAuthState("anon");
        return;
      }
      setAuthState("authed");
      if (initialSaved === undefined) {
        const isSaved = await fetchSaveStatusBatched(collegeId);
        if (cancelled) return;
        setSaved(isSaved);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collegeId, initialSaved]);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    if (saved) {
      const result = await unsaveCollege(collegeId);
      if (result.ok) {
        setSaved(false);
      } else {
        setError("Couldn't remove. Please try again.");
      }
    } else {
      const result = await saveCollege(collegeId);
      if (result.ok) {
        setSaved(true);
      } else {
        setError("Couldn't save. Please try again.");
      }
    }
    setBusy(false);
  }

  if (authState === "loading") {
    return (
      <span className="inline-block h-9 w-28 animate-pulse rounded-lg bg-zinc-100" aria-hidden="true" />
    );
  }

  if (authState === "anon") {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-zinc-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <SaveIcon />
        Save
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
          saved
            ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"
            : "border border-zinc-300 text-zinc-700 hover:border-indigo-300 hover:bg-zinc-50 hover:text-indigo-700"
        }`}
      >
        <SaveIcon />
        {busy ? (saved ? "Removing…" : "Saving…") : saved ? "Saved" : "Save"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="mr-1.5 h-4 w-4">
      <path
        fillRule="evenodd"
        d="M9.546 3.414c-.116-.29-.482-.29-.599 0L5.52 8.525.9 9.38c-.274.045-.376.35-.169.54l3.4 3.104L2.98 14.54c-.085.274.233.48.47.333l3.05-1.78 3.05 1.78c.236.147.554-.06.47-.333l-1.15-3.537 3.4-3.104c.207-.19.105-.495-.17-.54l-4.619-.855-3.426-5.11Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
