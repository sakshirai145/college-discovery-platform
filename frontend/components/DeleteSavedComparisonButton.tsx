"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteSavedComparisonButtonProps = {
  id: string;
};

export default function DeleteSavedComparisonButton({ id }: DeleteSavedComparisonButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/saved/comparisons?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError("Couldn't delete. Please try again.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
