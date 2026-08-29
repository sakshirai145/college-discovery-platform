import { auth } from "@/auth";
import { getCollegesSavedStatus, collegeIdExists } from "@/lib/services/saved-service";

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const collegeIdParam = searchParams.get("collegeId");

  if (idsParam) {
    const collegeIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (collegeIds.length === 0) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }
    const statuses = await getCollegesSavedStatus(session.user.id, collegeIds);
    return Response.json({ saved: statuses });
  } else if (collegeIdParam) {
    const collegeId = collegeIdParam.trim();
    if (!collegeId) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }
    if (!(await collegeIdExists(collegeId))) {
      return Response.json({ error: "College not found" }, { status: 404 });
    }
    const statuses = await getCollegesSavedStatus(session.user.id, [collegeId]);
    return Response.json({ saved: statuses[collegeId] || false });
  }

  return Response.json({ error: "Missing query parameters" }, { status: 400 });
});
