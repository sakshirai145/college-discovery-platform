import { z } from "zod";
import { auth } from "@/auth";
import {
  saveCollege,
  removeSavedCollege,
  listSavedColleges,
  collegeIdExists,
} from "@/lib/services/saved-service";

const saveSchema = z.object({
  collegeId: z.string().trim().min(1).max(64),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(9),
});

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = req;
  const query = Object.fromEntries(new URL(url).searchParams);
  const parsed = listQuerySchema.safeParse(query);
  if (!parsed.success) {
    return Response.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize } = parsed.data;
  const result = await listSavedColleges(session.user.id, page, pageSize);
  return Response.json(result);
});

export const POST = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { collegeId } = parsed.data;

  try {
    if (!(await collegeIdExists(collegeId))) {
      return Response.json({ error: "College not found" }, { status: 404 });
    }

    const record = await saveCollege(session.user.id, collegeId);
    return Response.json({ saved: true, id: record.id });
  } catch (error) {
    console.error("POST /api/saved/colleges failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = req;
  const query = Object.fromEntries(new URL(url).searchParams);
  const collegeId = typeof query.collegeId === "string" ? query.collegeId : undefined;

  if (!collegeId || collegeId.length === 0) {
    return Response.json({ error: "collegeId is required" }, { status: 400 });
  }

  try {
    if (!(await collegeIdExists(collegeId))) {
      return Response.json({ error: "College not found" }, { status: 404 });
    }

    await removeSavedCollege(session.user.id, collegeId);
    return Response.json({ saved: false });
  } catch (error) {
    console.error("DELETE /api/saved/colleges failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
