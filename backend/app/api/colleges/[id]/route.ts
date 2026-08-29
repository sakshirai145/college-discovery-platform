import { NextRequest } from "next/server";
import { getCollegeById } from "@/lib/services/college-service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/colleges/[id]">) {
  const { id } = await ctx.params;

  try {
    const college = await getCollegeById(id);

    if (!college) {
      return Response.json({ error: "College not found" }, { status: 404 });
    }

    return Response.json({ data: college });
  } catch (error) {
    console.error(`GET /api/colleges/[id] failed for ${id}`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
