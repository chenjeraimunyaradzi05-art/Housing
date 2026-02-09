import { z } from 'zod';

// Property type enums
export const propertyTypeEnum = z.enum([
  'single_family',
  'multi_family',
  'condo',
  'townhouse',
  'land',
  'commercial',
]);

export const listingTypeEnum = z.enum(['sale', 'rent', 'lease_to_own']);

export const propertyStatusEnum = z.enum([
  'draft',
  'active',
  'pending',
  'sold',
  'rented',
  'off_market',
]);

export const lotSizeUnitEnum = z.enum(['sqft', 'acres']);
export const hoaFrequencyEnum = z.enum(['monthly', 'quarterly', 'yearly']);
export const rentPeriodEnum = z.enum(['monthly', 'weekly', 'yearly']);
export const documentTypeEnum = z.enum(['disclosure', 'inspection', 'title', 'other']);

// Create property schema
export const createPropertySchema = z.object({
  body: z.object({
    // Basic Info
    title: z.string().min(5).max(200),
    description: z.string().max(5000).optional(),

    // Property Details
    propertyType: propertyTypeEnum,
    listingType: listingTypeEnum,
    status: propertyStatusEnum.optional().default('draft'),

    // Pricing
    price: z.number().positive().max(999999999999),
    currency: z.string().length(3).optional().default('USD'),

    // For rentals
    rentAmount: z.number().positive().optional(),
    rentPeriod: rentPeriodEnum.optional(),
    securityDeposit: z.number().positive().optional(),

    // Location
    address: z.string().min(5).max(200),
    addressLine2: z.string().max(100).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    zipCode: z.string().min(3).max(20),
    country: z.string().length(2).optional().default('US'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    neighborhood: z.string().max(100).optional(),

    // Property Specs
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().min(0).max(50).optional(),
    squareFeet: z.number().int().positive().max(1000000).optional(),
    lotSize: z.number().positive().optional(),
    lotSizeUnit: lotSizeUnitEnum.optional(),
    yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
    stories: z.number().int().min(1).max(200).optional(),
    parkingSpaces: z.number().int().min(0).max(100).optional(),
    garageSpaces: z.number().int().min(0).max(20).optional(),

    // Features
    features: z.array(z.string()).optional().default([]),
    amenities: z.array(z.string()).optional().default([]),
    utilities: z.array(z.string()).optional().default([]),

    // Investment Info
    isInvestment: z.boolean().optional().default(false),
    capRate: z.number().min(0).max(100).optional(),
    noi: z.number().optional(),
    occupancyRate: z.number().min(0).max(100).optional(),
    monthlyRent: z.number().positive().optional(),
    annualTaxes: z.number().positive().optional(),
    annualInsurance: z.number().positive().optional(),
    hoaFees: z.number().positive().optional(),
    hoaFrequency: hoaFrequencyEnum.optional(),
  }),
});

// Update property schema (all fields optional)
export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: createPropertySchema.shape.body.partial(),
});

// Get property by ID schema
export const getPropertySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

// List properties schema with filters
export const listPropertiesSchema = z.object({
  query: z.object({
    // Pagination
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),

    // Sorting
    sortBy: z.enum(['price', 'createdAt', 'squareFeet', 'bedrooms', 'bathrooms']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

    // Filters
    status: propertyStatusEnum.optional(),
    propertyType: propertyTypeEnum.optional(),
    listingType: listingTypeEnum.optional(),

    // Price range
    minPrice: z.string().transform(Number).pipe(z.number().positive()).optional(),
    maxPrice: z.string().transform(Number).pipe(z.number().positive()).optional(),

    // Location
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),

    // Specs
    minBedrooms: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
    maxBedrooms: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
    minBathrooms: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    maxBathrooms: z.string().transform(Number).pipe(z.number().min(0)).optional(),
    minSquareFeet: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    maxSquareFeet: z.string().transform(Number).pipe(z.number().int().positive()).optional(),

    // Search
    search: z.string().optional(),

    // Owner filter
    ownerId: z.string().optional(),
  }),
});

// Property image upload schema
export const uploadPropertyImageSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    caption: z.string().max(200).optional(),
    isPrimary: z.boolean().optional().default(false),
  }).optional(),
});

// Delete property image schema
export const deletePropertyImageSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    imageId: z.string().min(1),
  }),
});

// Save/unsave property schema
export const savePropertySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    notes: z.string().max(500).optional(),
  }).optional(),
});

// List saved properties schema
export const listSavedPropertiesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  }),
});

// Type exports
export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];
export type ListPropertiesQuery = z.infer<typeof listPropertiesSchema>['query'];
