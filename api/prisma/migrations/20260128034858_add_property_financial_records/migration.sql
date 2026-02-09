/*
  Warnings:

  - You are about to drop the `coinvestment_distributions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coinvestment_investors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coinvestment_pools` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "coinvestment_distributions" DROP CONSTRAINT "coinvestment_distributions_investorId_fkey";

-- DropForeignKey
ALTER TABLE "coinvestment_distributions" DROP CONSTRAINT "coinvestment_distributions_poolId_fkey";

-- DropForeignKey
ALTER TABLE "coinvestment_investors" DROP CONSTRAINT "coinvestment_investors_poolId_fkey";

-- DropForeignKey
ALTER TABLE "coinvestment_pools" DROP CONSTRAINT "coinvestment_pools_propertyId_fkey";

-- DropTable
DROP TABLE "coinvestment_distributions";

-- DropTable
DROP TABLE "coinvestment_investors";

-- DropTable
DROP TABLE "coinvestment_pools";

-- CreateTable
CREATE TABLE "property_taxes" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "assessedValue" DECIMAL(12,2),
    "taxRate" DECIMAL(6,4),
    "paidDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_insurances" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT,
    "coverageType" TEXT NOT NULL,
    "coverageAmount" DECIMAL(12,2) NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "premiumFrequency" TEXT NOT NULL DEFAULT 'annual',
    "deductible" DECIMAL(10,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "vendorName" TEXT,
    "vendorContact" TEXT,
    "vendorNotes" TEXT,
    "photos" TEXT[],
    "receipts" TEXT[],
    "reportedBy" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_expenses" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_incomes" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "tenantName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_taxes_propertyId_idx" ON "property_taxes"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "property_taxes_propertyId_year_key" ON "property_taxes"("propertyId", "year");

-- CreateIndex
CREATE INDEX "property_insurances_propertyId_idx" ON "property_insurances"("propertyId");

-- CreateIndex
CREATE INDEX "property_insurances_status_idx" ON "property_insurances"("status");

-- CreateIndex
CREATE INDEX "maintenance_records_propertyId_idx" ON "maintenance_records"("propertyId");

-- CreateIndex
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");

-- CreateIndex
CREATE INDEX "maintenance_records_category_idx" ON "maintenance_records"("category");

-- CreateIndex
CREATE INDEX "property_expenses_propertyId_idx" ON "property_expenses"("propertyId");

-- CreateIndex
CREATE INDEX "property_expenses_category_idx" ON "property_expenses"("category");

-- CreateIndex
CREATE INDEX "property_expenses_date_idx" ON "property_expenses"("date");

-- CreateIndex
CREATE INDEX "property_incomes_propertyId_idx" ON "property_incomes"("propertyId");

-- CreateIndex
CREATE INDEX "property_incomes_category_idx" ON "property_incomes"("category");

-- CreateIndex
CREATE INDEX "property_incomes_date_idx" ON "property_incomes"("date");
