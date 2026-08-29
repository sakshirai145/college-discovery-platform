-- CreateTable
CREATE TABLE "SavedComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedComparisonCollege" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SavedComparisonCollege_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedComparison_userId_idx" ON "SavedComparison"("userId");

-- CreateIndex
CREATE INDEX "SavedComparisonCollege_comparisonId_idx" ON "SavedComparisonCollege"("comparisonId");

-- CreateIndex
CREATE INDEX "SavedComparisonCollege_collegeId_idx" ON "SavedComparisonCollege"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedComparisonCollege_comparisonId_collegeId_key" ON "SavedComparisonCollege"("comparisonId", "collegeId");

-- AddForeignKey
ALTER TABLE "SavedComparison" ADD CONSTRAINT "SavedComparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedComparisonCollege" ADD CONSTRAINT "SavedComparisonCollege_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "SavedComparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedComparisonCollege" ADD CONSTRAINT "SavedComparisonCollege_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
