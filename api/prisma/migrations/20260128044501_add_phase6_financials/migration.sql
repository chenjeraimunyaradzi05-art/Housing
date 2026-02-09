/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrls` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `vendorName` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `vendorNotes` on the `maintenance_records` table. All the data in the column will be lost.
  - You are about to drop the column `annualPremium` on the `property_insurance` table. All the data in the column will be lost.
  - You are about to drop the column `documentUrl` on the `property_insurance` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyPremium` on the `property_insurance` table. All the data in the column will be lost.
  - You are about to drop the column `policyType` on the `property_insurance` table. All the data in the column will be lost.
  - You are about to drop the column `assessedValue` on the `property_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `property_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `property_taxes` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `property_taxes` table. All the data in the column will be lost.
  - You are about to drop the `mortgage_calculations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `coverageType` to the `property_insurance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `premium` to the `property_insurance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "maintenance_records" DROP COLUMN "assignedTo",
DROP COLUMN "imageUrls",
DROP COLUMN "receiptUrls",
DROP COLUMN "vendorName",
DROP COLUMN "vendorNotes",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "property_insurance" DROP COLUMN "annualPremium",
DROP COLUMN "documentUrl",
DROP COLUMN "monthlyPremium",
DROP COLUMN "policyType",
ADD COLUMN     "coverageType" TEXT NOT NULL,
ADD COLUMN     "premium" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "premiumFrequency" TEXT NOT NULL DEFAULT 'yearly',
ALTER COLUMN "deductible" DROP NOT NULL;

-- AlterTable
ALTER TABLE "property_taxes" DROP COLUMN "assessedValue",
DROP COLUMN "paidAmount",
DROP COLUMN "receiptUrl",
DROP COLUMN "taxRate";

-- DropTable
DROP TABLE "mortgage_calculations";

-- AddForeignKey
ALTER TABLE "property_taxes" ADD CONSTRAINT "property_taxes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_insurance" ADD CONSTRAINT "property_insurance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
