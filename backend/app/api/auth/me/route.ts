import { auth } from "@/auth";

export const GET = auth((req) => {
  const session = req.auth;
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
  });
});
