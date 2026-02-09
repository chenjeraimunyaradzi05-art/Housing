/*
  Warnings:

  - You are about to drop the `comparable_sales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_insurance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_taxes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "comparable_sales";

-- DropTable
DROP TABLE "maintenance_records";

-- DropTable
DROP TABLE "property_insurance";

-- DropTable
DROP TABLE "property_taxes";

-- CreateTable
CREATE TABLE "coinvestment_pools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "propertyId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minInvestment" DECIMAL(15,2) NOT NULL,
    "maxInvestment" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expectedReturn" DECIMAL(5,2),
    "holdingPeriod" INTEGER,
    "distributionFreq" TEXT NOT NULL DEFAULT 'quarterly',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "fundingDeadline" TIMESTAMP(3),
    "entityType" TEXT,
    "entityName" TEXT,
    "operatingAgreementUrl" TEXT,
    "contractAddress" TEXT,
    "tokenAddress" TEXT,
    "investorCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fundedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "coinvestment_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_investors" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investmentAmount" DECIMAL(15,2) NOT NULL,
    "sharesOwned" DECIMAL(10,4) NOT NULL,
    "percentageOwned" DECIMAL(5,4) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentIntentId" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "exitedAt" TIMESTAMP(3),
    "totalDistributed" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "coinvestment_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_distributions" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "investorId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "txHash" TEXT,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coinvestment_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_pools_slug_key" ON "coinvestment_pools"("slug");

-- CreateIndex
CREATE INDEX "coinvestment_pools_propertyId_idx" ON "coinvestment_pools"("propertyId");

-- CreateIndex
CREATE INDEX "coinvestment_pools_creatorId_idx" ON "coinvestment_pools"("creatorId");

-- CreateIndex
CREATE INDEX "coinvestment_pools_status_idx" ON "coinvestment_pools"("status");

-- CreateIndex
CREATE INDEX "coinvestment_pools_slug_idx" ON "coinvestment_pools"("slug");

-- CreateIndex
CREATE INDEX "coinvestment_investors_poolId_idx" ON "coinvestment_investors"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_investors_userId_idx" ON "coinvestment_investors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_investors_poolId_userId_key" ON "coinvestment_investors"("poolId", "userId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_poolId_idx" ON "coinvestment_distributions"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_investorId_idx" ON "coinvestment_distributions"("investorId");

-- AddForeignKey
ALTER TABLE "coinvestment_pools" ADD CONSTRAINT "coinvestment_pools_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_investors" ADD CONSTRAINT "coinvestment_investors_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_distributions" ADD CONSTRAINT "coinvestment_distributions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_distributions" ADD CONSTRAINT "coinvestment_distributions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "coinvestment_investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
