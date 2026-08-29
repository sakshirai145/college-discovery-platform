"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [maxFees, setMaxFees] = useState(searchParams.get("maxFees") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "rating");
  const [order, setOrder] = useState(searchParams.get("order") || "desc");

  function apply(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams();
    const current = {
      q,
      location,
      maxFees,
      minRating,
      sort,
      order,
      ...overrides,
    };

    (Object.entries(current) as [string, string][]).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) params.set(key, value);
    });

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply();
  }

  function handleReset() {
    setQ("");
    setLocation("");
    setMaxFees("");
    setMinRating("");
    setSort("rating");
    setOrder("desc");
    router.push(pathname);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="search-q" className="sr-only">
            Search colleges by name or location
          </label>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="search-q"
            name="q"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search colleges by name or location..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="filter-location" className="mb-1 block text-xs font-medium text-zinc-500">Location</label>
          <input
            id="filter-location"
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Mumbai, Chennai"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="filter-max-fees" className="mb-1 block text-xs font-medium text-zinc-500">Max fees (₹)</label>
          <input
            id="filter-max-fees"
            name="maxFees"
            type="number"
            value={maxFees}
            onChange={(e) => setMaxFees(e.target.value)}
            placeholder="e.g. 500000"
            min={0}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="filter-min-rating" className="mb-1 block text-xs font-medium text-zinc-500">Min rating</label>
          <select
            id="filter-min-rating"
            name="minRating"
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value);
              apply({ minRating: e.target.value });
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500"
          >
            <option value="">Any rating</option>
            <option value="4.5">4.5+</option>
            <option value="4.0">4.0+</option>
            <option value="3.5">3.5+</option>
            <option value="3.0">3.0+</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-zinc-500">Sort by</label>
          <select
            id="filter-sort"
            name="sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              apply({ sort: e.target.value });
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500"
          >
            <option value="rating">Rating</option>
            <option value="fees">Fees</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
    </form>
  );
}
