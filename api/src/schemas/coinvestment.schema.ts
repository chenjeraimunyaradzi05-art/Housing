import { z } from 'zod';

// ==================== ENUMS ====================

export const poolStatusEnum = z.enum([
  'draft',
  'seeking',
  'funded',
  'active',
  'distributing',
  'completed',
  'cancelled',
]);

export const riskLevelEnum = z.enum(['low', 'moderate', 'high']);

export const investmentTypeEnum = z.enum(['equity', 'debt', 'hybrid']);

export const distributionFrequencyEnum = z.enum(['monthly', 'quarterly', 'annually']);

export const paymentStatusEnum = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
]);

export const distributionTypeEnum = z.enum([
  'dividend',
  'interest',
  'principal_return',
  'sale_proceeds',
]);

// ==================== CREATE POOL ====================

export const createPoolSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    description: z.string().max(5000).optional(),
    propertyId: z.string().uuid().optional(),

    // Financial
    targetAmount: z.number().positive('Target amount must be positive'),
    minInvestment: z.number().positive('Minimum investment must be positive'),
    maxInvestment: z.number().positive().optional(),
    sharePrice: z.number().positive('Share price must be positive'),
    totalShares: z.number().int().positive('Total shares must be positive'),

    // Returns
    expectedReturn: z.number().min(0).max(100).optional(),
    holdPeriod: z.number().int().positive().optional(),
    distributionFrequency: distributionFrequencyEnum.default('quarterly'),

    // Timeline
    startDate: z.string().datetime().optional(),
    fundingDeadline: z.string().datetime().optional(),

    // Details
    managementFee: z.number().min(0).max(10).default(2.0),
    riskLevel: riskLevelEnum.default('moderate'),
    investmentType: investmentTypeEnum.default('equity'),
    propertyType: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
    highlights: z.array(z.string()).max(10).optional(),
    images: z.array(z.string().url()).max(20).optional(),
  }),
});

// ==================== UPDATE POOL ====================

export const updatePoolSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().max(5000).optional(),
    targetAmount: z.number().positive().optional(),
    minInvestment: z.number().positive().optional(),
    maxInvestment: z.number().positive().optional().nullable(),
    sharePrice: z.number().positive().optional(),
    totalShares: z.number().int().positive().optional(),
    expectedReturn: z.number().min(0).max(100).optional(),
    holdPeriod: z.number().int().positive().optional().nullable(),
    distributionFrequency: distributionFrequencyEnum.optional(),
    startDate: z.string().datetime().optional().nullable(),
    fundingDeadline: z.string().datetime().optional().nullable(),
    managementFee: z.number().min(0).max(10).optional(),
    riskLevel: riskLevelEnum.optional(),
    investmentType: investmentTypeEnum.optional(),
    propertyType: z.string().max(100).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    highlights: z.array(z.string()).max(10).optional(),
    images: z.array(z.string().url()).max(20).optional(),
    status: poolStatusEnum.optional(),
  }),
});

// ==================== GET POOL ====================

export const getPoolSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// ==================== LIST POOLS ====================

export const listPoolsSchema = z.object({
  query: z.object({
    status: poolStatusEnum.optional(),
    riskLevel: riskLevelEnum.optional(),
    investmentType: investmentTypeEnum.optional(),
    minInvestment: z.string().transform(Number).pipe(z.number().positive()).optional(),
    maxInvestment: z.string().transform(Number).pipe(z.number().positive()).optional(),
    location: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(v => v ? Number(v) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(Math.max(Number(v), 1), 50) : 12),
    sortBy: z.enum(['createdAt', 'targetAmount', 'expectedReturn', 'raisedAmount']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// ==================== INVEST IN POOL ====================

export const investInPoolSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    shares: z.number().int().positive('Number of shares must be positive'),
    agreementSigned: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the investment terms',
    }),
    paymentMethodId: z.string().optional(), // Stripe payment method ID
  }),
});

// ==================== CREATE DISTRIBUTION ====================

export const createDistributionSchema = z.object({
  params: z.object({
    poolId: z.string().cuid(),
  }),
  body: z.object({
    type: distributionTypeEnum,
    period: z.string().max(20).optional(),
    grossAmount: z.number().positive('Gross amount must be positive'),
    fees: z.number().min(0).default(0),
    taxes: z.number().min(0).default(0),
    notes: z.string().max(1000).optional(),
  }),
});

// ==================== GET USER INVESTMENTS ====================

export const getUserInvestmentsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
    page: z.string().optional().transform(v => v ? Number(v) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(Math.max(Number(v), 1), 50) : 20),
  }),
});

// ==================== GET POOL DISTRIBUTIONS ====================

export const getDistributionsSchema = z.object({
  params: z.object({
    poolId: z.string().cuid(),
  }),
  query: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    page: z.string().optional().transform(v => v ? Number(v) : 1),
    limit: z.string().optional().transform(v => v ? Math.min(Math.max(Number(v), 1), 50) : 20),
  }),
});

// ==================== CANCEL INVESTMENT ====================

export const cancelInvestmentSchema = z.object({
  params: z.object({
    investorId: z.string().cuid(),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

// ==================== CANCEL POOL ====================

export const cancelPoolSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    reason: z.string().max(1000),
    notifyInvestors: z.boolean().default(true),
  }),
});

// ==================== PROCESS DISTRIBUTION PAYOUT ====================

export const processDistributionPayoutSchema = z.object({
  params: z.object({
    distributionId: z.string().cuid(),
  }),
});

// ==================== TYPE EXPORTS ====================

export type CreatePoolInput = z.infer<typeof createPoolSchema>['body'];
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>['body'];
export type ListPoolsQuery = z.infer<typeof listPoolsSchema>['query'];
export type InvestInPoolInput = z.infer<typeof investInPoolSchema>['body'];
export type CreateDistributionInput = z.infer<typeof createDistributionSchema>['body'];
export type GetUserInvestmentsQuery = z.infer<typeof getUserInvestmentsSchema>['query'];
export type CancelInvestmentInput = z.infer<typeof cancelInvestmentSchema>['body'];
export type CancelPoolInput = z.infer<typeof cancelPoolSchema>['body'];
export type PoolStatus = z.infer<typeof poolStatusEnum>;
export type RiskLevel = z.infer<typeof riskLevelEnum>;
export type InvestmentType = z.infer<typeof investmentTypeEnum>;
