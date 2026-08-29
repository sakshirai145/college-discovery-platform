import { NextRequest } from "next/server";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid login data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    const headers = new Headers();
    const response = signInResult as Response;
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
  } catch {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }
}
