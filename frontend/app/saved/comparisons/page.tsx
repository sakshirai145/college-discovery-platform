import Link from "next/link";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import DeleteSavedComparisonButton from "@/components/DeleteSavedComparisonButton";
import { fetchMySavedComparisons } from "@/lib/api-client";

export default async function SavedComparisonsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const result = await fetchMySavedComparisons(cookieHeader || null);

  let body: React.ReactNode;

  if (result.ok === false && result.status === 401) {
    body = (
      <div className="mx-auto w-full max-w-md">
        <EmptyState message="Sign in to view your saved comparisons." />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Log in to view saved comparisons
          </Link>
        </div>
      </div>
    );
  } else if (result.ok === false) {
    body = (
      <EmptyState message="Something went wrong while loading your saved comparisons. Please try again." />
    );
  } else if (result.ok && result.data.length === 0) {
    body = (
      <div className="mx-auto w-full max-w-md">
        <EmptyState message="You haven't saved any comparisons yet." />
        <div className="mt-6 text-center">
          <Link
            href="/compare"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ← Compare colleges
          </Link>
        </div>
      </div>
    );
  } else {
    const comparisons = result.data;
    body = (
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparisons.map((comparison) => {
          const collegeIds = comparison.colleges
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((c) => c.collegeId);
          const reopenHref = `/compare?ids=${encodeURIComponent(collegeIds.join(","))}`;
          return (
            <div
              key={comparison.id}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-base font-semibold text-zinc-900">
                {comparison.title || "Untitled comparison"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Saved {new Date(comparison.createdAt).toLocaleDateString()}
              </p>
              <ul className="mt-3 space-y-1">
                {comparison.colleges
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((c) => (
                    <li key={c.id} className="text-sm text-zinc-700">
                      {c.college.name}
                      <span className="text-zinc-400"> · {c.college.location}</span>
                    </li>
                  ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3">
                <Link
                  href={reopenHref}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Reopen →
                </Link>
                <DeleteSavedComparisonButton id={comparison.id} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Saved Comparisons
          </h1>
          <p className="mt-1 text-zinc-600">
            Comparisons you&apos;ve saved for later.
          </p>
        </div>
        {body}
      </main>
    </div>
  );
}
