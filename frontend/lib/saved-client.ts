export type SaveStatusResult = { ok: true; saved: boolean } | { ok: false; status: number };

export async function fetchSaveStatus(collegeId: string): Promise<SaveStatusResult> {
  const res = await fetch(`/api/saved/colleges/status?collegeId=${encodeURIComponent(collegeId)}`, {
    cache: "no-store",
  });
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  const json = (await res.json()) as { saved: boolean };
  return { ok: true, saved: json.saved };
}

export type SaveResult = { ok: true; saved: boolean } | { ok: false; status: number };

export async function saveCollege(collegeId: string): Promise<SaveResult> {
  const res = await fetch("/api/saved/colleges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collegeId }),
  });
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, saved: true };
}

export async function unsaveCollege(collegeId: string): Promise<SaveResult> {
  const res = await fetch(`/api/saved/colleges?collegeId=${encodeURIComponent(collegeId)}`, {
    method: "DELETE",
  });
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, saved: false };
}

export type SaveComparisonResult = { ok: true; id: string } | { ok: false; status: number };

export async function saveComparison(
  collegeIds: string[],
  title?: string
): Promise<SaveComparisonResult> {
  const res = await fetch("/api/saved/comparisons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collegeIds, title: title || null }),
  });
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  const json = (await res.json()) as { id: string };
  return { ok: true, id: json.id };
}

export type AuthUser = { id: string; name: string; email: string } | null;

let cachedUserPromise: Promise<AuthUser> | null = null;

export function clearAuthCache(): void {
  cachedUserPromise = null;
}

export async function fetchMe(): Promise<AuthUser> {
  if (!cachedUserPromise) {
    cachedUserPromise = fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as { user: AuthUser };
        return json.user ?? null;
      })
      .catch(() => null);
  }
  return cachedUserPromise;
}

export async function checkAuth(): Promise<boolean> {
  const user = await fetchMe();
  return user !== null;
}

export type SaveStatusesResult = { ok: true; saved: Record<string, boolean> } | { ok: false; status: number };

export async function fetchSaveStatuses(collegeIds: string[]): Promise<SaveStatusesResult> {
  if (collegeIds.length === 0) return { ok: true, saved: {} };
  const res = await fetch(`/api/saved/colleges/status?ids=${encodeURIComponent(collegeIds.join(","))}`, {
    cache: "no-store",
  });
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  const json = (await res.json()) as { saved: Record<string, boolean> };
  return { ok: true, saved: json.saved };
}

let pendingBatchIds: string[] = [];
let batchTimeout: NodeJS.Timeout | null = null;
let batchCallbacks: { resolve: (val: boolean) => void; reject: (err: unknown) => void; id: string }[] = [];

export async function fetchSaveStatusBatched(collegeId: string): Promise<boolean> {
  const authed = await checkAuth();
  if (!authed) return false;

  return new Promise((resolve, reject) => {
    pendingBatchIds.push(collegeId);
    batchCallbacks.push({ resolve, reject, id: collegeId });

    if (!batchTimeout) {
      batchTimeout = setTimeout(async () => {
        const idsToFetch = [...new Set(pendingBatchIds)];
        const currentCallbacks = [...batchCallbacks];

        pendingBatchIds = [];
        batchCallbacks = [];
        batchTimeout = null;

        try {
          const result = await fetchSaveStatuses(idsToFetch);
          if (result.ok) {
            const savedMap = result.saved;
            currentCallbacks.forEach(({ resolve, id }) => {
              resolve(!!savedMap[id]);
            });
          } else {
            currentCallbacks.forEach(({ resolve }) => {
              resolve(false);
            });
          }
        } catch {
          currentCallbacks.forEach(({ resolve }) => {
            resolve(false);
          });
        }
      }, 50);
    }
  });
}

export type SavedCollegesPayload = {
  data: {
    id: string;
    createdAt: string;
    college: {
      id: string;
      slug: string;
      name: string;
      location: string;
      fees: number;
      rating: number;
      imageUrl: string | null;
      description: string;
    };
  }[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type FetchSavedCollegesResult = { ok: true; data: SavedCollegesPayload } | { ok: false; status: number };

export async function fetchSavedColleges(params?: {
  page?: number;
  pageSize?: number;
}): Promise<FetchSavedCollegesResult> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  const res = await fetch(`/api/saved/colleges${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (res.status === 401) return { ok: false, status: 401 };
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: (await res.json()) as SavedCollegesPayload };
}
