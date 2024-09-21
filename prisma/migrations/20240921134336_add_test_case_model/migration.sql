/*
  Warnings:

  - You are about to drop the column `testCases` on the `DailyChallenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailyChallenge" DROP COLUMN "testCases";

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
