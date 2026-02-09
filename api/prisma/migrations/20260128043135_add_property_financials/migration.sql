/*
  Warnings:

  - You are about to drop the column `photos` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `receipts` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `reportedBy` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `requestedDate` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the `coinvestment_distributions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coinvestment_investors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coinvestment_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coinvestment_pools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coinvestment_updates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_expenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_incomes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_insurances` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdBy` to the `maintenance_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "coinvestment_distributions" DROP CONSTRAINT "coinvestment_distributions_poolId_fkey";

-- DropForeignKey
ALTER TABLE "coinvestment_investors" DROP CONSTRAINT "coinvestment_investors_poolId_fkey";

-- DropForeignKey
ALTER TABLE "coinvestment_payments" DROP CONSTRAINT "coinvestment_payments_distributionId_fkey";

-- DropForeignKey
ALTER TABLE "coinvestment_updates" DROP CONSTRAINT "coinvestment_updates_poolId_fkey";

-- AlterTable
ALTER TABLE "maintenance_records" DROP COLUMN "photos",
DROP COLUMN "receipts",
DROP COLUMN "reportedBy",
DROP COLUMN "requestedDate",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "receiptUrls" TEXT[];

-- AlterTable
ALTER TABLE "property_taxes" ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "receiptUrl" TEXT;

-- DropTable
DROP TABLE "coinvestment_distributions";

-- DropTable
DROP TABLE "coinvestment_investors";

-- DropTable
DROP TABLE "coinvestment_payments";

-- DropTable
DROP TABLE "coinvestment_pools";

-- DropTable
DROP TABLE "coinvestment_updates";

-- DropTable
DROP TABLE "property_expenses";

-- DropTable
DROP TABLE "property_incomes";

-- DropTable
DROP TABLE "property_insurances";

-- CreateTable
CREATE TABLE "property_insurance" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT,
    "policyType" TEXT NOT NULL,
    "coverageAmount" DECIMAL(12,2) NOT NULL,
    "deductible" DECIMAL(10,2) NOT NULL,
    "annualPremium" DECIMAL(10,2) NOT NULL,
    "monthlyPremium" DECIMAL(8,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_calculations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT,
    "loanAmount" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(5,3) NOT NULL,
    "loanTermMonths" INTEGER NOT NULL,
    "downPayment" DECIMAL(12,2) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "monthlyPayment" DECIMAL(10,2) NOT NULL,
    "totalPayment" DECIMAL(14,2) NOT NULL,
    "totalInterest" DECIMAL(14,2) NOT NULL,
    "propertyTax" DECIMAL(8,2),
    "homeInsurance" DECIMAL(8,2),
    "pmi" DECIMAL(8,2),
    "hoaFees" DECIMAL(8,2),
    "totalMonthlyPayment" DECIMAL(10,2),
    "name" TEXT,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortgage_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_insurance_propertyId_idx" ON "property_insurance"("propertyId");

-- CreateIndex
CREATE INDEX "mortgage_calculations_userId_idx" ON "mortgage_calculations"("userId");

-- CreateIndex
CREATE INDEX "mortgage_calculations_propertyId_idx" ON "mortgage_calculations"("propertyId");
