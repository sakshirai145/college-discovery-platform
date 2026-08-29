import { signOut } from "@/auth";

export async function POST() {
  try {
    const signOutResult = await signOut({ redirect: false });

    const headers = new Headers();
    const response = signOutResult as Response;
    if (
      response &&
      typeof (response as { headers?: unknown }).headers === "object" &&
      typeof (response.headers as { getSetCookie?: unknown }).getSetCookie === "function"
    ) {
      (response.headers as { getSetCookie: () => string[] })
        .getSetCookie()
        .forEach((cookie) => headers.append("set-cookie", cookie));
    }

    return Response.json({ ok: true }, { status: 200, headers });
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
