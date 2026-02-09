-- CreateTable
CREATE TABLE "coinvestment_pools" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "minimumInvestment" DECIMAL(10,2) NOT NULL,
    "maximumInvestment" DECIMAL(10,2),
    "currentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expectedROI" DECIMAL(5,2),
    "holdPeriod" INTEGER,
    "targetCloseDate" TIMESTAMP(3),
    "maxInvestors" INTEGER NOT NULL DEFAULT 99,
    "feesPercent" DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "acquisitionStatus" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "operatingAgreementUrl" TEXT,
    "subscriptionAgreementUrl" TEXT,
    "managerId" TEXT NOT NULL,
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
    "investmentAmount" DECIMAL(12,2) NOT NULL,
    "ownershipPercent" DECIMAL(6,4) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentIntentId" TEXT,
    "paymentMethod" TEXT,
    "subscriptionSigned" BOOLEAN NOT NULL DEFAULT false,
    "accreditedVerified" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "coinvestment_investors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_distributions" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "statementUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinvestment_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_payments" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "ownershipPercent" DECIMAL(6,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transferId" TEXT,
    "payoutMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "coinvestment_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coinvestment_updates" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'investors',
    "attachments" TEXT[],
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coinvestment_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_pools_slug_key" ON "coinvestment_pools"("slug");

-- CreateIndex
CREATE INDEX "coinvestment_pools_managerId_idx" ON "coinvestment_pools"("managerId");

-- CreateIndex
CREATE INDEX "coinvestment_pools_propertyId_idx" ON "coinvestment_pools"("propertyId");

-- CreateIndex
CREATE INDEX "coinvestment_pools_status_idx" ON "coinvestment_pools"("status");

-- CreateIndex
CREATE INDEX "coinvestment_pools_visibility_idx" ON "coinvestment_pools"("visibility");

-- CreateIndex
CREATE INDEX "coinvestment_investors_poolId_idx" ON "coinvestment_investors"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_investors_userId_idx" ON "coinvestment_investors"("userId");

-- CreateIndex
CREATE INDEX "coinvestment_investors_paymentStatus_idx" ON "coinvestment_investors"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_investors_poolId_userId_key" ON "coinvestment_investors"("poolId", "userId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_poolId_idx" ON "coinvestment_distributions"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_status_idx" ON "coinvestment_distributions"("status");

-- CreateIndex
CREATE INDEX "coinvestment_distributions_distributionDate_idx" ON "coinvestment_distributions"("distributionDate");

-- CreateIndex
CREATE INDEX "coinvestment_payments_distributionId_idx" ON "coinvestment_payments"("distributionId");

-- CreateIndex
CREATE INDEX "coinvestment_payments_userId_idx" ON "coinvestment_payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coinvestment_payments_distributionId_userId_key" ON "coinvestment_payments"("distributionId", "userId");

-- CreateIndex
CREATE INDEX "coinvestment_updates_poolId_idx" ON "coinvestment_updates"("poolId");

-- CreateIndex
CREATE INDEX "coinvestment_updates_type_idx" ON "coinvestment_updates"("type");

-- AddForeignKey
ALTER TABLE "coinvestment_investors" ADD CONSTRAINT "coinvestment_investors_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_distributions" ADD CONSTRAINT "coinvestment_distributions_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_payments" ADD CONSTRAINT "coinvestment_payments_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "coinvestment_distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coinvestment_updates" ADD CONSTRAINT "coinvestment_updates_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "coinvestment_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
