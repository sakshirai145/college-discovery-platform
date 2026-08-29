import { NextRequest } from "next/server";
import { collegeListQuerySchema } from "@/lib/validations";
import { listColleges } from "@/lib/services/college-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = collegeListQuerySchema.safeParse({
      q: searchParams.get("q") || undefined,
      location: searchParams.get("location") || undefined,
      minFees: searchParams.get("minFees") || undefined,
      maxFees: searchParams.get("maxFees") || undefined,
      minRating: searchParams.get("minRating") || undefined,
      sort: searchParams.get("sort") || undefined,
      order: searchParams.get("order") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await listColleges(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("GET /api/colleges failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
