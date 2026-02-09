-- CreateTable
CREATE TABLE "comparable_sales" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(3,1),
    "squareFeet" INTEGER,
    "lotSize" DECIMAL(10,2),
    "yearBuilt" INTEGER,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL,
    "daysOnMarket" INTEGER,
    "pricePerSqFt" DECIMAL(8,2),
    "adjustmentTotal" DECIMAL(5,2) DEFAULT 0,
    "adjustments" TEXT[],
    "adjustedPrice" DECIMAL(12,2),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceUrl" TEXT,
    "dataProvider" TEXT,
    "distanceFromSubject" DOUBLE PRECISION,
    "saleRecency" INTEGER,
    "relevanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparable_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comparable_sales_propertyId_idx" ON "comparable_sales"("propertyId");

-- CreateIndex
CREATE INDEX "comparable_sales_city_state_idx" ON "comparable_sales"("city", "state");

-- CreateIndex
CREATE INDEX "comparable_sales_saleDate_idx" ON "comparable_sales"("saleDate");

-- AddForeignKey
ALTER TABLE "comparable_sales" ADD CONSTRAINT "comparable_sales_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
