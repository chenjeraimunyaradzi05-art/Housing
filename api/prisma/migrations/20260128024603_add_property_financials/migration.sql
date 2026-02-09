-- CreateTable
CREATE TABLE "property_taxes" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "assessedValue" DECIMAL(12,2),
    "taxRate" DECIMAL(6,4),
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
    "type" TEXT NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "premiumFrequency" TEXT NOT NULL DEFAULT 'annual',
    "deductible" DECIMAL(10,2),
    "coverageAmount" DECIMAL(12,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
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
    "vendorName" TEXT,
    "vendorContact" TEXT,
    "vendorEmail" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparable_sales" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "pricePerSqFt" DECIMAL(8,2),
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(3,1),
    "squareFeet" INTEGER,
    "yearBuilt" INTEGER,
    "propertyType" TEXT,
    "distanceMiles" DECIMAL(5,2),
    "similarity" DECIMAL(5,2),
    "source" TEXT,
    "sourceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparable_sales_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "comparable_sales_propertyId_idx" ON "comparable_sales"("propertyId");

-- CreateIndex
CREATE INDEX "comparable_sales_saleDate_idx" ON "comparable_sales"("saleDate");

-- AddForeignKey
ALTER TABLE "property_taxes" ADD CONSTRAINT "property_taxes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_insurances" ADD CONSTRAINT "property_insurances_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparable_sales" ADD CONSTRAINT "comparable_sales_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
