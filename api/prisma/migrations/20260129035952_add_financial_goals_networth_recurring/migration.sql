/*
  Warnings:

  - You are about to drop the `withdrawal_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "withdrawal_requests_bankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "withdrawal_requests_investorId_fkey";

-- DropForeignKey
ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "withdrawal_requests_poolId_fkey";

-- DropForeignKey
ALTER TABLE "withdrawal_requests" DROP CONSTRAINT "withdrawal_requests_userId_fkey";

-- DropTable
DROP TABLE "withdrawal_requests";

-- CreateTable
CREATE TABLE "financial_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "currentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "targetDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "linkedAccountId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT NOT NULL DEFAULT '#10B981',
    "icon" TEXT,
    "autoContribute" BOOLEAN NOT NULL DEFAULT false,
    "monthlyTarget" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_contributions" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "net_worth_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAssets" DECIMAL(14,2) NOT NULL,
    "totalLiabilities" DECIMAL(14,2) NOT NULL,
    "netWorth" DECIMAL(14,2) NOT NULL,
    "cashAndSavings" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "investments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "realEstate" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherAssets" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "creditCards" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "loans" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherLiabilities" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "net_worth_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "averageAmount" DECIMAL(10,2) NOT NULL,
    "frequency" TEXT NOT NULL,
    "lastOccurrence" TIMESTAMP(3) NOT NULL,
    "nextExpected" TIMESTAMP(3),
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    "category" TEXT,
    "isSubscription" BOOLEAN NOT NULL DEFAULT false,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_goals_userId_idx" ON "financial_goals"("userId");

-- CreateIndex
CREATE INDEX "financial_goals_type_idx" ON "financial_goals"("type");

-- CreateIndex
CREATE INDEX "financial_goals_status_idx" ON "financial_goals"("status");

-- CreateIndex
CREATE INDEX "goal_contributions_goalId_idx" ON "goal_contributions"("goalId");

-- CreateIndex
CREATE INDEX "goal_contributions_createdAt_idx" ON "goal_contributions"("createdAt");

-- CreateIndex
CREATE INDEX "net_worth_snapshots_userId_idx" ON "net_worth_snapshots"("userId");

-- CreateIndex
CREATE INDEX "net_worth_snapshots_snapshotDate_idx" ON "net_worth_snapshots"("snapshotDate");

-- CreateIndex
CREATE INDEX "recurring_transactions_userId_idx" ON "recurring_transactions"("userId");

-- CreateIndex
CREATE INDEX "recurring_transactions_frequency_idx" ON "recurring_transactions"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_transactions_userId_merchantName_key" ON "recurring_transactions"("userId", "merchantName");

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "financial_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
