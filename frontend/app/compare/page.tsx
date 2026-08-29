import Link from "next/link";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import SaveComparisonButton from "@/components/SaveComparisonButton";
import { fetchCompareColleges } from "@/lib/api-client";
import { formatCurrency, formatRating } from "@/lib/format";
import type { CompareCollege } from "@collegehub/shared";

function parseSelectedIds(searchParams: Record<string, string | string[] | undefined>): string[] {
  const raw = Array.isArray(searchParams.ids) ? searchParams.ids.join(",") : searchParams.ids || "";
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, 3);
}

export default async function ComparePage(
  props: PageProps<"/compare">
) {
  const searchParams = await props.searchParams;
  const ids = parseSelectedIds(searchParams);

  const counts = ids.length;

  if (counts === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Compare Colleges
          </h1>
          <p className="mt-1 text-zinc-600">
            Select 2–3 colleges to see them side by side.
          </p>
          <div className="mt-6">
            <EmptyState message="No colleges selected yet. Pick at least two colleges to start comparing." />
          </div>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              ← Go to college listing
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (counts === 1) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Compare Colleges
          </h1>
          <p className="mt-1 text-zinc-600">
            At least 2 colleges are required to compare.
          </p>
          <div className="mt-6">
            <EmptyState message="You have selected 1 college. Please add at least one more to run a comparison." />
          </div>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              ← Back to college listing
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const result = await fetchCompareColleges(ids);

  if (!result.ok) {
    const isNotFound = result.status === 404;
    const message = isNotFound
      ? "One or more of the selected colleges no longer exist. Remove them from your selection and try again."
      : "Something went wrong while loading the comparison. Please try again.";
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Compare Colleges
          </h1>
          <div className="mt-6">
            <EmptyState message={message} />
          </div>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              ← Back to college listing
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const colleges = result.data;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          ← Back to results
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Compare Colleges
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="text-zinc-600">
            Comparing {colleges.length} colleges side by side.
          </p>
          <SaveComparisonButton collegeIds={ids} />
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-[640px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="sticky left-0 w-32 bg-zinc-50 px-4 py-3 text-left align-top text-xs font-medium uppercase tracking-wide text-zinc-500">
                  College
                </th>
                {colleges.map((college) => (
                  <th
                    key={college.id}
                    className="px-4 py-3 text-left align-top"
                  >
                    <div className="flex flex-col gap-2">
                      {college.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={college.imageUrl}
                          alt={college.name}
                          className="h-20 w-full rounded-lg border border-zinc-200 object-cover"
                        />
                      )}
                      <Link
                        href={`/colleges/${college.id}`}
                        className="font-semibold text-zinc-900 hover:text-indigo-600"
                      >
                        {college.name}
                      </Link>
                      <span className="text-sm font-normal text-zinc-500">{college.location}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <TableRow label="Rating" valueRenderer={(c) => formatRating(c.rating)} colleges={colleges} />
              <TableRow label="Annual fees" valueRenderer={(c) => formatCurrency(c.fees)} colleges={colleges} />
              <TableRow
                label="Established"
                valueRenderer={(c) => (c.established ? String(c.established) : "—")}
                colleges={colleges}
              />
              <TableRow label="Location" valueRenderer={(c) => c.location} colleges={colleges} />
              <TableRow
                label="Latest placement"
                valueRenderer={(c) => {
                  const p = c.placements[0];
                  if (!p) return "—";
                  const parts = [
                    `${p.year ? `Class of ${p.year}: ` : ""}${formatCurrency(p.avgPackage)} avg`,
                  ];
                  if (p.highestPackage) parts.push(`highest ${formatCurrency(p.highestPackage)}`);
                  if (p.placementRate) parts.push(`${p.placementRate}% placed`);
                  return parts.join(" · ");
                }}
                colleges={colleges}
              />
              <TableRow
                label="Courses offered"
                valueRenderer={(c) =>
                  c.courses.length ? c.courses.map((course) => course.name).join(" · ") : "—"
                }
                colleges={colleges}
              />
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function TableRow({
  label,
  valueRenderer,
  colleges,
}: {
  label: string;
  valueRenderer: (college: CompareCollege) => string;
  colleges: CompareCollege[];
}) {
  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 bg-zinc-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
      >
        {label}
      </th>
      {colleges.map((college) => (
        <td key={college.id} className="px-4 py-3 text-zinc-700">
          {valueRenderer(college)}
        </td>
      ))}
    </tr>
  );
}
