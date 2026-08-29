import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { signupSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid signup data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    console.error("POST /api/auth/signup failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  try {
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    const headers = new Headers();
    const response = signInResult as Response;
    if (response && typeof (response as { headers?: unknown }).headers === "object") {
      const setCookies = response.headers.getSetCookie?.();
      setCookies?.forEach((cookie) => headers.append("set-cookie", cookie));
    }

    return Response.json({ user }, { status: 200, headers });
  } catch (error) {
    console.error("POST /api/auth/signup auto-signin failed", error);
    return Response.json({ user }, { status: 200 });
  }
}
