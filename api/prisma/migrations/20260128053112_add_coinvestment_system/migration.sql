-- DropIndex
DROP INDEX "coinvestment_investors_status_idx";

-- AlterTable
ALTER TABLE "coinvestment_investors" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "ownershipPercent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX "coinvestment_investors_paymentStatus_idx" ON "coinvestment_investors"("paymentStatus");

-- AddForeignKey
ALTER TABLE "coinvestment_pools" ADD CONSTRAINT "coinvestment_pools_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_investors" ADD CONSTRAINT "coinvestment_investors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
