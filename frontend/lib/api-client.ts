import type { CollegeDetail, CollegeListResult, CompareCollege } from "@collegehub/shared";

export type ListCollegesParams = {
  q?: string;
  location?: string;
  minFees?: string;
  maxFees?: string;
  minRating?: string;
  sort?: string;
  order?: string;
  page?: string;
  pageSize?: string;
};

/**
 * Client Components must use the frontend's same-origin `/api` rewrite. Server
 * Components can call the backend directly because they are not subject to the
 * browser's CORS policy and need an absolute URL for `fetch`.
 */
function apiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `/api${path}`;
  }

  const backendBaseUrl = process.env.BACKEND_URL || "http://localhost:4000";
  return `${backendBaseUrl}/api${path}`;
}

export async function fetchColleges(params: ListCollegesParams): Promise<CollegeListResult> {
  const searchParams = new URLSearchParams();
  (Object.entries(params) as [string, string | undefined][]).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  const url = apiUrl(`/colleges${queryString ? `?${queryString}` : ""}`);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch colleges (${response.status})`);
  }

  return response.json();
}

export async function fetchCollegeById(id: string): Promise<CollegeDetail | null> {
  const response = await fetch(apiUrl(`/colleges/${encodeURIComponent(id)}`), {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch college (${response.status})`);
  }

  const json = (await response.json()) as { data: CollegeDetail };
  return json.data;
}

export type CompareResult =
  | { ok: true; data: CompareCollege[] }
  | { ok: false; status: number };

export async function fetchCompareColleges(ids: string[]): Promise<CompareResult> {
  const response = await fetch(
    apiUrl(`/colleges/compare?ids=${encodeURIComponent(ids.join(","))}`),
    { cache: "no-store" }
  );

  if (!response.ok) {
    return { ok: false, status: response.status };
  }

  const json = (await response.json()) as { data: CompareCollege[] };
  return { ok: true, data: json.data };
}

export type SavedCollegesServerResult =
  | { ok: true; data: { total: number; page: number; pageSize: number; totalPages: number; items: CollegeItemWithSaved[] } }
  | { ok: false; status: number };

export type CollegeItemWithSaved = {
  id: string;
  createdAt: string;
  college: import("@collegehub/shared").CollegeListItem;
};

export async function fetchMySavedColleges(
  cookieHeader: string | null,
  page: number,
  pageSize: number
): Promise<SavedCollegesServerResult> {
  const response = await fetch(
    apiUrl(`/saved/colleges?page=${page}&pageSize=${pageSize}`),
    {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    }
  );
  if (response.status === 401) return { ok: false, status: 401 };
  if (!response.ok) return { ok: false, status: response.status };
  const json = (await response.json()) as { data: CollegeItemWithSaved[]; meta: { total: number; page: number; pageSize: number; totalPages: number } };
  return { ok: true, data: { ...json.meta, items: json.data } };
}

export type SavedComparisonServerItem = import("@collegehub/shared").SavedComparison;

export async function fetchMySavedComparisons(
  cookieHeader: string | null
): Promise<{ ok: true; data: SavedComparisonServerItem[] } | { ok: false; status: number }> {
  const response = await fetch(apiUrl("/saved/comparisons"), {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (response.status === 401) return { ok: false, status: 401 };
  if (!response.ok) return { ok: false, status: response.status };
  const json = (await response.json()) as { data: SavedComparisonServerItem[] };
  return { ok: true, data: json.data };
}
