/*
  Warnings:

  - Added the required column `feeAmount` to the `semesters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "semesters" ADD COLUMN     "feeAmount" DECIMAL(10,2) NOT NULL;
