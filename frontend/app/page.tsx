import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import SearchFilters from "@/components/SearchFilters";
import CollegeCard from "@/components/CollegeCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import AddToCompare from "@/components/AddToCompare";
import CompareSelection from "@/components/CompareSelection";
import SaveButton from "@/components/SaveButton";
import { fetchColleges, type ListCollegesParams } from "@/lib/api-client";
import type { CollegeListItem } from "@collegehub/shared";

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;

  const query: ListCollegesParams = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    location: typeof searchParams.location === "string" ? searchParams.location : undefined,
    minFees: typeof searchParams.minFees === "string" ? searchParams.minFees : undefined,
    maxFees: typeof searchParams.maxFees === "string" ? searchParams.maxFees : undefined,
    minRating: typeof searchParams.minRating === "string" ? searchParams.minRating : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    order: typeof searchParams.order === "string" ? searchParams.order : undefined,
    page: typeof searchParams.page === "string" ? searchParams.page : undefined,
    pageSize: typeof searchParams.pageSize === "string" ? searchParams.pageSize : undefined,
  };

  const { data: colleges, meta } = await fetchColleges(query);

  const queryString = new URLSearchParams();
  (Object.entries(query) as [string, string | undefined][]).forEach(([key, value]) => {
    // Keep every active filter in pagination links. Text filters and enum values
    // such as `q=IIT` and `sort=name` are not numeric, so checking their numeric
    // value here caused them to be silently discarded on the next page.
    if (value !== undefined && value !== "") queryString.set(key, value);
  });
  queryString.delete("page");

  const activeFilters = [
    query.q ? `"${query.q}"` : null,
    query.location ? `in ${query.location}` : null,
    query.maxFees !== undefined ? `under ${query.maxFees}` : null,
    query.minRating !== undefined ? `${query.minRating}+ stars` : null,
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Discover Colleges
          </h1>
          <p className="mt-1 text-zinc-600">
            Browse, search and compare colleges by rating, fees and location.
          </p>
        </div>

        <SearchFilters />

        <Suspense fallback={null}>
          <CompareSelection />
        </Suspense>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {meta.total} {meta.total === 1 ? "college" : "colleges"}
            {activeFilters.length > 0 && (
              <span className="text-zinc-400"> · filtered by {activeFilters.join(", ")}</span>
            )}
          </p>
        </div>

        {colleges.length === 0 ? (
          <div className="mt-4">
            <EmptyState message="Try adjusting your search terms or clearing some filters." />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((college: CollegeListItem) => (
              <CollegeCard
                key={college.id}
                college={college}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <SaveButton collegeId={college.id} />
                    <Suspense fallback={null}>
                      <AddToCompare collegeId={college.id} collegeName={college.name} />
                    </Suspense>
                  </div>
                }
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination page={meta.page} totalPages={meta.totalPages} query={queryString.toString()} />
        </div>
      </main>
    </div>
  );
}
