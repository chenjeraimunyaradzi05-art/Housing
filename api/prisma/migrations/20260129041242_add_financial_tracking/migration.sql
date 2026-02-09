/*
  Warnings:

  - You are about to drop the column `autoContribute` on the `financial_goals` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `financial_goals` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTarget` on the `financial_goals` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `goal_contributions` table. All the data in the column will be lost.
  - You are about to drop the column `cashAndSavings` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `creditCards` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `investments` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `isAutomatic` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `loans` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `otherLiabilities` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `realEstate` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `totalLiabilities` on the `net_worth_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `averageAmount` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isEssential` on the `recurring_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isSubscription` on the `recurring_transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,snapshotDate]` on the table `net_worth_snapshots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `totalDebt` to the `net_worth_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `recurring_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "financial_goals_type_idx";

-- DropIndex
DROP INDEX "goal_contributions_createdAt_idx";

-- DropIndex
DROP INDEX "recurring_transactions_frequency_idx";

-- DropIndex
DROP INDEX "recurring_transactions_userId_merchantName_key";

-- AlterTable
ALTER TABLE "financial_goals" DROP COLUMN "autoContribute",
DROP COLUMN "completedAt",
DROP COLUMN "monthlyTarget",
ALTER COLUMN "type" SET DEFAULT 'savings',
ALTER COLUMN "priority" SET DEFAULT 'medium',
ALTER COLUMN "priority" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "goal_contributions" DROP COLUMN "source",
ADD COLUMN     "contributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "transactionId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "net_worth_snapshots" DROP COLUMN "cashAndSavings",
DROP COLUMN "creditCards",
DROP COLUMN "investments",
DROP COLUMN "isAutomatic",
DROP COLUMN "loans",
DROP COLUMN "otherLiabilities",
DROP COLUMN "realEstate",
DROP COLUMN "totalLiabilities",
ADD COLUMN     "accountCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cashBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creditDebt" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "investmentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "loanDebt" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "propertyValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDebt" DECIMAL(14,2) NOT NULL;

-- AlterTable
ALTER TABLE "recurring_transactions" DROP COLUMN "averageAmount",
DROP COLUMN "isEssential",
DROP COLUMN "isSubscription",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "alertDaysBefore" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "amount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "amountVariation" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "dayOfMonth" INTEGER,
ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isAutoDetected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchedTransactionIds" TEXT[],
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "occurrenceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "merchantName" DROP NOT NULL,
ALTER COLUMN "lastOccurrence" DROP NOT NULL,
ALTER COLUMN "confidence" DROP NOT NULL,
ALTER COLUMN "confidence" DROP DEFAULT,
ALTER COLUMN "confidence" SET DATA TYPE DECIMAL(5,2);

-- CreateIndex
CREATE INDEX "financial_goals_targetDate_idx" ON "financial_goals"("targetDate");

-- CreateIndex
CREATE INDEX "goal_contributions_contributionDate_idx" ON "goal_contributions"("contributionDate");

-- CreateIndex
CREATE UNIQUE INDEX "net_worth_snapshots_userId_snapshotDate_key" ON "net_worth_snapshots"("userId", "snapshotDate");

-- CreateIndex
CREATE INDEX "recurring_transactions_status_idx" ON "recurring_transactions"("status");

-- CreateIndex
CREATE INDEX "recurring_transactions_nextExpected_idx" ON "recurring_transactions"("nextExpected");
