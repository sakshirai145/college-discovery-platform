"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { clearAuthCache, fetchMe, type AuthUser } from "@/lib/saved-client";

export default function Navbar() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loaded, setLoaded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors; still show logged-out UI
    }
    clearAuthCache();
    setUser(null);
    setLoggingOut(false);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-indigo-600">CollegeHub</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Discover
          </Link>
          <Link
            href="/compare"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Compare
          </Link>

          {!loaded ? null : user ? (
            <>
              <Link
                href="/saved"
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Saved
              </Link>
              <Link
                href="/saved/comparisons"
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Saved Comparisons
              </Link>
              <span className="hidden items-center gap-1.5 text-sm text-zinc-600 sm:inline-flex">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
                  aria-hidden="true"
                >
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </span>
                <span className="max-w-[10rem] truncate font-medium text-zinc-900">{user.name}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
