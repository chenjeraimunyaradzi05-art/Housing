/*
  Warnings:

  - You are about to drop the column `similarity` on the `comparable_sales` table. All the data in the column will be lost.
  - You are about to drop the column `actualCost` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `vendorEmail` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `vendorName` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `property_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `property_taxes` table. All the data in the column will be lost.
  - You are about to drop the `property_insurances` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comparable_sales" DROP CONSTRAINT "comparable_sales_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_records" DROP CONSTRAINT "maintenance_records_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "property_insurances" DROP CONSTRAINT "property_insurances_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "property_taxes" DROP CONSTRAINT "property_taxes_propertyId_fkey";

-- DropIndex
DROP INDEX "comparable_sales_saleDate_idx";

-- AlterTable
ALTER TABLE "comparable_sales" DROP COLUMN "similarity",
ADD COLUMN     "adjustedPrice" DECIMAL(12,2),
ADD COLUMN     "adjustments" TEXT;

-- AlterTable
ALTER TABLE "maintenance_records" DROP COLUMN "actualCost",
DROP COLUMN "receiptUrl",
DROP COLUMN "vendorEmail",
DROP COLUMN "vendorName",
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "cost" DECIMAL(10,2),
ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "property_taxes" DROP COLUMN "paidAmount",
DROP COLUMN "status",
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "property_insurances";

-- CreateTable
CREATE TABLE "property_insurance" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT,
    "type" TEXT NOT NULL,
    "coverage" DECIMAL(12,2) NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "premiumFrequency" TEXT NOT NULL DEFAULT 'yearly',
    "deductible" DECIMAL(10,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_insurance_propertyId_idx" ON "property_insurance"("propertyId");
