/*
  Warnings:

  - You are about to alter the column `alertThreshold` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to drop the column `categoryId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `user_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `limitBalance` on the `user_accounts` table. All the data in the column will be lost.
  - You are about to drop the column `syncError` on the `user_accounts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_budgetId_fkey";

-- DropIndex
DROP INDEX "transactions_budgetId_idx";

-- DropIndex
DROP INDEX "user_accounts_plaidItemId_key";

-- DropIndex
DROP INDEX "user_accounts_type_idx";

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "alertThreshold" SET DEFAULT 80,
ALTER COLUMN "alertThreshold" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "categoryId",
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "tags" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_accounts" DROP COLUMN "lastSyncedAt",
DROP COLUMN "limitBalance",
DROP COLUMN "syncError",
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "includeInNetWorth" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSynced" TIMESTAMP(3),
ADD COLUMN     "limit" DECIMAL(14,2),
ALTER COLUMN "currentBalance" DROP NOT NULL,
ALTER COLUMN "currentBalance" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "availableBalance" SET DATA TYPE DECIMAL(14,2);

-- CreateIndex
CREATE INDEX "user_accounts_status_idx" ON "user_accounts"("status");
