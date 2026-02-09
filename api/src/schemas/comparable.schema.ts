import { z } from 'zod';

export const createComparableSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  propertyType: z.string(),
  bedrooms: z.number().int().positive().optional().nullable(),
  bathrooms: z.number().positive().optional().nullable(),
  squareFeet: z.number().int().positive().optional().nullable(),
  lotSize: z.number().positive().optional().nullable(),
  yearBuilt: z.number().int().min(1800).optional().nullable(),
  salePrice: z.number().positive(),
  saleDate: z.string().datetime(),
  daysOnMarket: z.number().int().positive().optional().nullable(),
  pricePerSqFt: z.number().positive().optional().nullable(),
  adjustmentTotal: z.number().optional().nullable(),
  adjustments: z.array(z.string()).optional().default([]),
  adjustedPrice: z.number().positive().optional().nullable(),
  source: z.enum(['manual', 'zillow', 'redfin', 'mls']).default('manual'),
  sourceUrl: z.string().url().optional().nullable(),
  dataProvider: z.string().optional().nullable(),
  distanceFromSubject: z.number().positive().optional().nullable(),
  saleRecency: z.number().int().optional().nullable(),
  relevanceScore: z.number().min(0).max(100).optional().nullable(),
});

export const updateComparableSchema = createComparableSchema.partial();

export const listComparablesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const batchCreateComparablesSchema = z.object({
  comparables: z.array(createComparableSchema).min(1).max(50),
});
