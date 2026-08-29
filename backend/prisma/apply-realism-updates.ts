import { PrismaClient } from "@prisma/client";
import { criticalReviewOverrides, ratingOverrides } from "./realism";

const prisma = new PrismaClient();
const sampleReviewerEmail = "sample.prospect@collegehub.test";
const demoMarker = " (Sample review prepared for the CollegeHub demo dataset.)";

async function main() {
  const reviewer = await prisma.user.findUnique({
    where: { email: sampleReviewerEmail },
    select: { id: true },
  });
  if (!reviewer) throw new Error(`Required sample reviewer ${sampleReviewerEmail} was not found.`);

  const updates = Object.entries(ratingOverrides);
  for (const [name, rating] of updates) {
    const college = await prisma.college.findFirst({ where: { name }, select: { id: true } });
    if (!college) throw new Error(`College not found: ${name}`);

    await prisma.college.update({ where: { id: college.id }, data: { rating } });
    const review = criticalReviewOverrides[name];
    if (!review) continue;

    await prisma.review.upsert({
      where: { collegeId_userId: { collegeId: college.id, userId: reviewer.id } },
      update: { rating: review.rating, title: review.title, comment: `${review.comment}${demoMarker}` },
      create: { collegeId: college.id, userId: reviewer.id, rating: review.rating, title: review.title, comment: `${review.comment}${demoMarker}` },
    });
  }

  console.log(`Updated ratings for ${updates.length} existing colleges.`);
  console.log(`Added or updated ${Object.keys(criticalReviewOverrides).length} balanced sample reviews.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
