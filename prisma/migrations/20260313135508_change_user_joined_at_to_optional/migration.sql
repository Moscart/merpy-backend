/*
  Warnings:

  - You are about to drop the column `status` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "status",
ALTER COLUMN "joinedAt" DROP DEFAULT;

-- DropEnum
DROP TYPE "UserStatus";
