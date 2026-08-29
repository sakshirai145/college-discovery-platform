import { NextRequest } from "next/server";
import { compareQuerySchema } from "@/lib/validations";
import { getCollegesForCompare } from "@/lib/services/college-service";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const parsed = compareQuerySchema.safeParse({ ids: idsParam || "" });

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid comparison ids", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const ids = parsed.data.ids
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const colleges = await getCollegesForCompare(ids);

    if (colleges.length !== ids.length) {
      return Response.json({ error: "One or more colleges not found" }, { status: 404 });
    }

    return Response.json({ data: colleges });
  } catch (error) {
    console.error("GET /api/colleges/compare failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
