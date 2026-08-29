import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CollegeNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-sm font-semibold text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
          College not found
        </h1>
        <p className="mt-2 text-zinc-600">
          The requested college does not exist or may have been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ← Back to results
        </Link>
      </main>
    </div>
  );
}
