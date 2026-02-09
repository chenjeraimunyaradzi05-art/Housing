-- CreateTable
CREATE TABLE "coinvestment_pools" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "raisedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minInvestment" DECIMAL(10,2) NOT NULL,
    "maxInvestment" DECIMAL(10,2),
    "sharePrice" DECIMAL(10,2) NOT NULL,
    "totalShares" INTEGER NOT NULL,
    "availableShares" INTEGER NOT NULL,
    "expectedReturn" DECIMAL(5,2),
    "holdPeriod" INTEGER,
    "distributionFrequency" TEXT NOT NULL DEFAULT 'quarterly',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "fundingDeadline" TIMESTAMP(3),
    "managerId" TEXT NOT NULL,
    "managementFee" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "investmentType" TEXT NOT NULL DEFAULT 'equity',
    "propertyType" TEXT,
    "location" TEXT,
    "highlights" JSONB,
    "documents" JSONB,
    "images" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinvestment_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_investors" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "amountInvested" DECIMAL(12,2) NOT NULL,
    "sharePrice" DECIMAL(10,2) NOT NULL,
    "stripePaymentId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "agreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "agreementSignedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalDistributed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ownershipPercent" DECIMAL(5,4) NOT NULL,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinvestment_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_distributions" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "investorId" TEXT,
    "type" TEXT NOT NULL,
    "period" TEXT,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT,
    "stripeTransferId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinvestment_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_pools_slug_key" ON "coinvestment_pools"("slug");

-- CreateIndex
CREATE INDEX "coinvestment_pools_status_idx" ON "coinvestment_pools"("status");

-- CreateIndex
CREATE INDEX "coinvestment_pools_managerId_idx" ON "coinvestment_pools"("managerId");

-- CreateIndex
CREATE INDEX "coinvestment_pools_propertyId_idx" ON "coinvestment_pools"("propertyId");

-- CreateIndex
CREATE INDEX "coinvestment_investors_userId_idx" ON "coinvestment_investors"("userId");

-- CreateIndex
CREATE INDEX "coinvestment_investors_poolId_idx" ON "coinvestment_investors"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_investors_status_idx" ON "coinvestment_investors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_investors_poolId_userId_key" ON "coinvestment_investors"("poolId", "userId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_poolId_idx" ON "coinvestment_distributions"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_investorId_idx" ON "coinvestment_distributions"("investorId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_status_idx" ON "coinvestment_distributions"("status");

-- AddForeignKey
ALTER TABLE "coinvestment_investors" ADD CONSTRAINT "coinvestment_investors_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_distributions" ADD CONSTRAINT "coinvestment_distributions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_distributions" ADD CONSTRAINT "coinvestment_distributions_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "coinvestment_investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
