import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import SaveButton from "@/components/SaveButton";
import { formatCurrency, formatRating } from "@/lib/format";
import { fetchCollegeById } from "@/lib/api-client";

export default async function CollegeDetailPage(props: PageProps<"/colleges/[id]">) {
  const { id } = await props.params;

  let college: import("@collegehub/shared").CollegeDetail | null = null;
  let fetchError = false;
  try {
    college = await fetchCollegeById(id);
  } catch {
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← Back to results
          </Link>
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The server is warming up — please{" "}
            <a href={`/colleges/${id}`} className="font-semibold underline">refresh the page</a>{" "}
            in a moment.
          </div>
        </main>
      </div>
    );
  }

  if (!college) {
    notFound();
  }

  const showImage = Boolean(college.imageUrl);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          ← Back to results
        </Link>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  {college.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">{college.location}</p>
                {college.established && (
                  <p className="mt-0.5 text-sm text-zinc-500">Established {college.established}</p>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                    clipRule="evenodd"
                  />
                </svg>
                {formatRating(college.rating)}
              </span>
            </div>

            {showImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={college.imageUrl!}
                alt={college.name}
                className="mt-5 aspect-video w-full rounded-2xl border border-zinc-200 object-cover"
              />
            )}

            <section className="mt-6">
              <h2 className="text-lg font-semibold text-zinc-900">About</h2>
              <p className="mt-2 text-zinc-600">{college.description}</p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-zinc-400">Annual fees</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(college.fees)}</p>
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <SaveButton collegeId={college.id} />
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900">Courses</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 text-right font-medium">Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {college.courses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">{course.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{course.duration}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(course.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {college.courses.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">No courses listed.</p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900">Placements</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {college.placements.map((placement) => (
              <div key={placement.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-zinc-500">Class of {placement.year}</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {formatCurrency(placement.avgPackage)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">Average package</p>
              </div>
            ))}
            {college.placements.length === 0 && (
              <p className="text-sm text-zinc-500">No placement data available.</p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-900">Reviews</h2>
          <div className="mt-3 space-y-3">
            {college.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-zinc-900">{review.user.name}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-700">
                    {formatRating(review.rating)}
                  </span>
                </div>
                {review.title && <p className="mt-1 text-sm font-medium text-zinc-700">{review.title}</p>}
                <p className="mt-1 text-sm text-zinc-600">{review.comment}</p>
              </div>
            ))}
            {college.reviews.length === 0 && (
              <p className="text-sm text-zinc-500">No reviews yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
