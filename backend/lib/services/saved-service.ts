import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const savedCollegeSelect = {
  id: true,
  createdAt: true,
  college: {
    select: {
      id: true,
      slug: true,
      name: true,
      location: true,
      fees: true,
      rating: true,
      imageUrl: true,
      description: true,
    },
  },
} satisfies Prisma.SavedCollegeSelect;

export async function isCollegeSaved(userId: string, collegeId: string) {
  const count = await prisma.savedCollege.count({
    where: { userId, collegeId },
  });
  return count > 0;
}

export async function getCollegesSavedStatus(userId: string, collegeIds: string[]) {
  const saved = await prisma.savedCollege.findMany({
    where: {
      userId,
      collegeId: { in: collegeIds },
    },
    select: { collegeId: true },
  });
  
  const savedSet = new Set(saved.map((s) => s.collegeId));
  const result: Record<string, boolean> = {};
  collegeIds.forEach((id) => {
    result[id] = savedSet.has(id);
  });
  return result;
}

export async function saveCollege(userId: string, collegeId: string) {
  try {
    return await prisma.savedCollege.create({ data: { userId, collegeId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.savedCollege.findUnique({
        where: { userId_collegeId: { userId, collegeId } },
      });
      if (existing) return existing;
    }
    throw error;
  }
}

export async function removeSavedCollege(userId: string, collegeId: string) {
  const result = await prisma.savedCollege.deleteMany({
    where: { userId, collegeId },
  });
  return result.count > 0;
}

export async function listSavedColleges(userId: string, page: number, pageSize: number) {
  const where = { userId };
  const [total, data] = await Promise.all([
    prisma.savedCollege.count({ where }),
    prisma.savedCollege.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: savedCollegeSelect,
    }),
  ]);

  return {
    data,
    meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function collegeIdExists(collegeId: string) {
  const college = await prisma.college.findUnique({ where: { id: collegeId }, select: { id: true } });
  return college !== null;
}

export async function collegesExistByIds(collegeIds: string[]) {
  if (collegeIds.length === 0) return new Set<string>();
  const colleges = await prisma.college.findMany({
    where: { id: { in: collegeIds } },
    select: { id: true },
  });
  return new Set(colleges.map((c) => c.id));
}

export async function insertComparison(
  userId: string,
  title: string | null,
  collegeIds: string[]
) {
  const normalized = [...collegeIds].sort();
  const setKey = normalized.join("\u0001");

  const existing = await prisma.savedComparison.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      colleges: { select: { collegeId: true } },
    },
  });

  for (const comp of existing) {
    const compKey = comp.colleges.map((c) => c.collegeId).sort().join("\u0001");
    if (compKey === setKey) {
      return comp;
    }
  }

  return prisma.savedComparison.create({
    data: {
      userId,
      title,
      colleges: {
        create: collegeIds.map((collegeId, index) => ({ collegeId, position: index })),
      },
    },
  });
}

export async function listSavedComparisons(userId: string) {
  return prisma.savedComparison.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      colleges: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          collegeId: true,
          position: true,
          college: {
            select: {
              id: true,
              slug: true,
              name: true,
              location: true,
              fees: true,
              rating: true,
              established: true,
              imageUrl: true,
              placements: { orderBy: { year: "desc" }, take: 1 },
              courses: { select: { name: true, duration: true, fees: true } },
            },
          },
        },
      },
    },
  });
}

export async function deleteComparison(userId: string, comparisonId: string) {
  const result = await prisma.savedComparison.deleteMany({
    where: { id: comparisonId, userId },
  });
  return result.count > 0;
}
