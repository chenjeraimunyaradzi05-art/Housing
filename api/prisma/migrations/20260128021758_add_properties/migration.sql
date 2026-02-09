/*
  Warnings:

  - You are about to drop the column `availableDate` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceCost` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `isRental` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `lastAppraisalDate` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `lastAppraisalValue` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `leaseTermMonths` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `parking` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `propertyTax` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `sqFeet` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `subType` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `properties` table. All the data in the column will be lost.
  - You are about to alter the column `latitude` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,8)`.
  - You are about to alter the column `longitude` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(11,8)`.
  - You are about to alter the column `bathrooms` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(3,1)`.
  - You are about to alter the column `lotSize` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `monthlyRent` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `securityDeposit` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `hoaFees` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to drop the column `key` on the `property_documents` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `property_documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `property_documents` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `property_images` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `property_images` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `propertyType` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedBy` to the `property_documents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "properties" DROP CONSTRAINT "properties_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "saved_properties" DROP CONSTRAINT "saved_properties_userId_fkey";

-- DropIndex
DROP INDEX "properties_type_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "availableDate",
DROP COLUMN "estimatedValue",
DROP COLUMN "insuranceCost",
DROP COLUMN "isFeatured",
DROP COLUMN "isRental",
DROP COLUMN "lastAppraisalDate",
DROP COLUMN "lastAppraisalValue",
DROP COLUMN "leaseTermMonths",
DROP COLUMN "parking",
DROP COLUMN "propertyTax",
DROP COLUMN "publishedAt",
DROP COLUMN "sqFeet",
DROP COLUMN "subType",
DROP COLUMN "type",
DROP COLUMN "unit",
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "annualInsurance" DECIMAL(10,2),
ADD COLUMN     "annualTaxes" DECIMAL(10,2),
ADD COLUMN     "capRate" DECIMAL(5,2),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "favoriteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "garageSpaces" INTEGER,
ADD COLUMN     "hoaFrequency" TEXT,
ADD COLUMN     "isInvestment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "listedAt" TIMESTAMP(3),
ADD COLUMN     "lotSizeUnit" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "noi" DECIMAL(12,2),
ADD COLUMN     "occupancyRate" DECIMAL(5,2),
ADD COLUMN     "parkingSpaces" INTEGER,
ADD COLUMN     "pricePerSqFt" DECIMAL(8,2),
ADD COLUMN     "propertyType" TEXT NOT NULL,
ADD COLUMN     "rentAmount" DECIMAL(10,2),
ADD COLUMN     "rentPeriod" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "soldAt" TIMESTAMP(3),
ADD COLUMN     "soldPrice" DECIMAL(12,2),
ADD COLUMN     "squareFeet" INTEGER,
ADD COLUMN     "utilities" TEXT[],
ALTER COLUMN "latitude" SET DATA TYPE DECIMAL(10,8),
ALTER COLUMN "longitude" SET DATA TYPE DECIMAL(11,8),
ALTER COLUMN "bathrooms" SET DATA TYPE DECIMAL(3,1),
ALTER COLUMN "lotSize" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "features" DROP DEFAULT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "monthlyRent" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "securityDeposit" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "hoaFees" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "listingType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "property_documents" DROP COLUMN "key",
DROP COLUMN "size",
DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "property_images" DROP COLUMN "key",
DROP COLUMN "sortOrder",
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thumbnailUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "properties"("propertyType");
