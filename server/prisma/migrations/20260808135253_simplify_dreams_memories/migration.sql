/*
  Warnings:

  - You are about to drop the column `location` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `targetDate` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `memoryDate` on the `Memory` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Memory_memoryDate_idx";

-- AlterTable
ALTER TABLE "Dream" DROP COLUMN "location",
DROP COLUMN "targetDate";

-- AlterTable
ALTER TABLE "Memory" DROP COLUMN "location",
DROP COLUMN "memoryDate";
