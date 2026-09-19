/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `instructors` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "instructors" DROP CONSTRAINT "instructors_approvedById_fkey";

-- AlterTable
ALTER TABLE "instructors" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
