/*
  Warnings:

  - You are about to drop the column `entityId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - Made the column `message` on table `notifications` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "notifications_createdAt_idx";

-- DropIndex
DROP INDEX "notifications_userId_isRead_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "isRead",
DROP COLUMN "metadata",
DROP COLUMN "readAt",
ADD COLUMN     "poolId" TEXT,
ADD COLUMN     "postId" TEXT,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "message" SET NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
