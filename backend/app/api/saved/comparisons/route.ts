import { z } from "zod";
import { auth } from "@/auth";
import {
  insertComparison,
  listSavedComparisons,
  deleteComparison,
  collegesExistByIds,
} from "@/lib/services/saved-service";

const saveSchema = z.object({
  collegeIds: z
    .array(z.string().trim().min(1).max(64))
    .min(2, "A comparison must contain at least 2 colleges")
    .max(3, "A comparison can contain at most 3 colleges")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Duplicate college ids are not allowed",
    }),
  title: z.string().trim().max(120).optional().nullable(),
});

const deleteQuerySchema = z.object({
  id: z.string().trim().min(1).max(64),
});

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await listSavedComparisons(session.user.id);
  return Response.json({ data });
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

  const { collegeIds, title } = parsed.data;

  try {
    const existing = await collegesExistByIds(collegeIds);
    const missing = collegeIds.filter((id) => !existing.has(id));
    if (missing.length > 0) {
      return Response.json({ error: "One or more colleges do not exist" }, { status: 404 });
    }

    const record = await insertComparison(
      session.user.id,
      title?.trim() ? title.trim() : null,
      collegeIds
    );

    return Response.json({ id: record.id, createdAt: record.createdAt }, { status: 201 });
  } catch (error) {
    console.error("POST /api/saved/comparisons failed", error);
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
  const parsed = deleteQuerySchema.safeParse(query);
  if (!parsed.success) {
    return Response.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const deleted = await deleteComparison(session.user.id, parsed.data.id);
    if (!deleted) {
      return Response.json({ error: "Saved comparison not found" }, { status: 404 });
    }
    return Response.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/saved/comparisons failed", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
