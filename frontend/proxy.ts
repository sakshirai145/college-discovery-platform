import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export const config = {
  matcher: "/colleges/:path*",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/colleges\/([^/]+)/);
  if (!match) return NextResponse.next();

  const id = match[1];

  try {
    const response = await fetch(
      `${backendBaseUrl}/api/colleges/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );

    if (response.status === 404) {
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }
  } catch {
    // Backend unreachable: let the page render and surface its own error.
  }

  return NextResponse.next();
}
