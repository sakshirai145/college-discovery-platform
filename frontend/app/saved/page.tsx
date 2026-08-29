import Link from "next/link";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import CollegeCard from "@/components/CollegeCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import SaveButton from "@/components/SaveButton";
import { fetchMySavedColleges } from "@/lib/api-client";

export default async function SavedPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const requestedPage = Number(
    typeof searchParams.page === "string" && searchParams.page ? searchParams.page : 1
  );
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = 9;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const result = await fetchMySavedColleges(cookieHeader || null, page, pageSize);

  let body: React.ReactNode;

  if (result.ok === false && result.status === 401) {
    body = (
      <div className="mx-auto w-full max-w-md">
        <EmptyState message="Sign in to view your saved colleges." />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Log in to view saved colleges
          </Link>
        </div>
      </div>
    );
  } else if (result.ok === false) {
    body = (
      <EmptyState message="Something went wrong while loading your saved colleges. Please try again." />
    );
  } else if (result.ok && result.data.items.length === 0) {
    body = (
      <div className="mx-auto w-full max-w-md">
        <EmptyState message="You haven't saved any colleges yet." />
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            ← Discover colleges
          </Link>
        </div>
      </div>
    );
  } else {
    const items = result.data.items;
    body = (
      <>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {result.data.total} saved {result.data.total === 1 ? "college" : "colleges"}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CollegeCard
              key={item.college.id}
              college={item.college}
              action={<SaveButton collegeId={item.college.id} initialSaved />}
            />
          ))}
        </div>
        <div className="mt-8">
          <Pagination
            page={result.data.page}
            totalPages={result.data.totalPages}
            query=""
            basePath="/saved"
          />
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Saved Colleges
          </h1>
          <p className="mt-1 text-zinc-600">
            Colleges you&apos;ve saved for later.
          </p>
        </div>
        {body}
      </main>
    </div>
  );
}
