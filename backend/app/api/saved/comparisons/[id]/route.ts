import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const GET = auth(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const comparison = await prisma.savedComparison.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      createdAt: true,
      colleges: {
        orderBy: { position: "asc" },
        select: { collegeId: true, position: true },
      },
    },
  });

  if (!comparison) {
    return Response.json({ error: "Saved comparison not found" }, { status: 404 });
  }

  return Response.json({
    id: comparison.id,
    title: comparison.title,
    createdAt: comparison.createdAt,
    collegeIds: comparison.colleges.map((c) => c.collegeId),
  });
});
