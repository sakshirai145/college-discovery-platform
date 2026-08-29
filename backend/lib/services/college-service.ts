import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CollegeListResult } from "@collegehub/shared";
import type { CollegeListQuery } from "@/lib/validations";

export async function listColleges(params: CollegeListQuery): Promise<CollegeListResult> {
  const { q, location, minFees, maxFees, minRating, sort, order, page, pageSize } = params;

  const where: Prisma.CollegeWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    ...(minFees !== undefined || maxFees !== undefined
      ? {
          fees: {
            ...(minFees !== undefined ? { gte: minFees } : {}),
            ...(maxFees !== undefined ? { lte: maxFees } : {}),
          },
        }
      : {}),
    ...(minRating !== undefined ? { rating: { gte: minRating } } : {}),
  };

  const orderBy: Prisma.CollegeOrderByWithRelationInput =
    sort === "name" ? { name: order } : sort === "fees" ? { fees: order } : { rating: order };

  const skip = (page - 1) * pageSize;

  const [total, colleges] = await Promise.all([
    prisma.college.count({ where }),
    prisma.college.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
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
    }),
  ]);

  return {
    data: colleges,
    meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getCollegeById(id: string) {
  return prisma.college.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      location: true,
      established: true,
      fees: true,
      rating: true,
      description: true,
      imageUrl: true,
      courses: { orderBy: { name: "asc" } },
      placements: { orderBy: { year: "desc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getCollegesForCompare(ids: string[]) {
  return prisma.college.findMany({
    where: { id: { in: ids } },
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
  });
}
