/*
  Warnings:

  - You are about to drop the column `amount` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `resolution` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedBy` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `aml_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resource` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the `gdpr_data_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kyc_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_events` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `aml_alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruleId` to the `aml_alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Made the column `details` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "aml_alerts_alertType_idx";

-- DropIndex
DROP INDEX "aml_alerts_createdAt_idx";

-- DropIndex
DROP INDEX "audit_logs_resource_resourceId_idx";

-- AlterTable
ALTER TABLE "aml_alerts" DROP COLUMN "amount",
DROP COLUMN "resolution",
DROP COLUMN "resolvedAt",
DROP COLUMN "resolvedBy",
DROP COLUMN "transactionId",
DROP COLUMN "updatedAt",
DROP COLUMN "userEmail",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "ruleId" TEXT NOT NULL,
ADD COLUMN     "transactionIds" TEXT[],
ALTER COLUMN "details" SET DEFAULT '{}',
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "errorMessage",
DROP COLUMN "resource",
DROP COLUMN "status",
DROP COLUMN "userEmail",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL,
ALTER COLUMN "details" SET NOT NULL,
ALTER COLUMN "details" SET DEFAULT '{}';

-- DropTable
DROP TABLE "gdpr_data_requests";

-- DropTable
DROP TABLE "kyc_documents";

-- DropTable
DROP TABLE "security_events";

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressCity" TEXT NOT NULL,
    "addressState" TEXT NOT NULL,
    "addressPostalCode" TEXT NOT NULL,
    "addressCountry" TEXT NOT NULL,
    "ssnLast4" TEXT,
    "taxId" TEXT,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aml_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transactionType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aml_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_deletion_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "scheduledDeletionAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");

-- CreateIndex
CREATE INDEX "aml_transactions_userId_idx" ON "aml_transactions"("userId");

-- CreateIndex
CREATE INDEX "aml_transactions_createdAt_idx" ON "aml_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "aml_transactions_amount_idx" ON "aml_transactions"("amount");

-- CreateIndex
CREATE INDEX "user_consents_userId_idx" ON "user_consents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_consentType_key" ON "user_consents"("userId", "consentType");

-- CreateIndex
CREATE INDEX "account_deletion_requests_userId_idx" ON "account_deletion_requests"("userId");

-- CreateIndex
CREATE INDEX "account_deletion_requests_status_idx" ON "account_deletion_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_userId_idx" ON "push_tokens"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_category_idx" ON "audit_logs"("category");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aml_transactions" ADD CONSTRAINT "aml_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aml_alerts" ADD CONSTRAINT "aml_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
