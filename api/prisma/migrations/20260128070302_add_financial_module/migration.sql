/*
  Warnings:

  - You are about to drop the column `description` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `rolloverUnused` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `totalBudget` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `aiCategoryConfidence` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `categorySource` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `customCategory` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isExcluded` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `locationCity` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `locationCountry` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `locationState` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `plaidCategory` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `recurringGroup` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `budget_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `linked_accounts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Made the column `accountId` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "budget_categories" DROP CONSTRAINT "budget_categories_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_userId_fkey";

-- DropForeignKey
ALTER TABLE "linked_accounts" DROP CONSTRAINT "linked_accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_accountId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_userId_fkey";

-- DropIndex
DROP INDEX "budgets_isActive_idx";

-- DropIndex
DROP INDEX "transactions_categoryId_idx";

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "rolloverUnused",
DROP COLUMN "totalBudget",
ADD COLUMN     "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "rollover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rolloverAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ALTER COLUMN "period" SET DEFAULT 'monthly';

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "aiCategoryConfidence",
DROP COLUMN "categorySource",
DROP COLUMN "customCategory",
DROP COLUMN "isExcluded",
DROP COLUMN "isRecurring",
DROP COLUMN "locationCity",
DROP COLUMN "locationCountry",
DROP COLUMN "locationState",
DROP COLUMN "plaidCategory",
DROP COLUMN "recurringGroup",
ADD COLUMN     "authorizedDate" TIMESTAMP(3),
ADD COLUMN     "budgetId" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" JSONB,
ADD COLUMN     "paymentChannel" TEXT,
ADD COLUMN     "paymentMeta" JSONB,
ADD COLUMN     "personalCategory" TEXT,
ADD COLUMN     "subcategory" TEXT,
ALTER COLUMN "accountId" SET NOT NULL;

-- DropTable
DROP TABLE "budget_categories";

-- DropTable
DROP TABLE "linked_accounts";

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plaidItemId" TEXT,
    "plaidAccessToken" TEXT,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "institutionLogo" TEXT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialName" TEXT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "mask" TEXT,
    "currentBalance" DECIMAL(12,2) NOT NULL,
    "availableBalance" DECIMAL(12,2),
    "limitBalance" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncedAt" TIMESTAMP(3),
    "syncError" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_plaidItemId_key" ON "user_accounts"("plaidItemId");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_accountId_key" ON "user_accounts"("accountId");

-- CreateIndex
CREATE INDEX "user_accounts_userId_idx" ON "user_accounts"("userId");

-- CreateIndex
CREATE INDEX "user_accounts_plaidItemId_idx" ON "user_accounts"("plaidItemId");

-- CreateIndex
CREATE INDEX "user_accounts_type_idx" ON "user_accounts"("type");

-- CreateIndex
CREATE INDEX "budgets_category_idx" ON "budgets"("category");

-- CreateIndex
CREATE INDEX "budgets_status_idx" ON "budgets"("status");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_budgetId_idx" ON "transactions"("budgetId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "user_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
