/**
 * Financial Module Validation Schemas
 * Zod schemas for accounts, transactions, and budgets
 */
import { z } from 'zod';

// ==================== ENUMS ====================

export const accountType = z.enum(['checking', 'savings', 'credit', 'loan', 'investment', 'other']);
export const accountStatus = z.enum(['active', 'inactive', 'error', 'disconnected']);
export const budgetPeriod = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);
export const budgetStatus = z.enum(['active', 'paused', 'completed']);

// ==================== ACCOUNT SCHEMAS ====================

export const linkAccountSchema = z.object({
  body: z.object({
    publicToken: z.string().min(1, 'Public token is required'),
    institutionId: z.string().optional(),
    institutionName: z.string().optional(),
  }),
});

export const createManualAccountSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: accountType,
    subtype: z.string().optional(),
    currentBalance: z.number().optional(),
    currency: z.string().default('USD'),
    institutionName: z.string().optional(),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    includeInNetWorth: z.boolean().optional(),
    currentBalance: z.number().optional(), // Only for manual accounts
  }),
});

export const listAccountsSchema = z.object({
  query: z.object({
    type: accountType.optional(),
    status: accountStatus.optional(),
    includeInactive: z.string().transform(v => v === 'true').optional(),
  }),
});

// ==================== TRANSACTION SCHEMAS ====================

export const listTransactionsSchema = z.object({
  query: z.object({
    accountId: z.string().optional(),
    category: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    minAmount: z.string().transform(Number).optional(),
    maxAmount: z.string().transform(Number).optional(),
    search: z.string().optional(),
    pending: z.string().transform(v => v === 'true').optional(),
    page: z.string().optional().transform(v => v ? parseInt(v) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v) : 50),
    sortBy: z.enum(['date', 'amount', 'name']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const createTransactionSchema = z.object({
  body: z.object({
    accountId: z.string().cuid(),
    name: z.string().min(1).max(200),
    amount: z.number(),
    date: z.string().datetime(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    merchantName: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    personalCategory: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isHidden: z.boolean().optional(),
    budgetId: z.string().cuid().nullable().optional(),
  }),
});

export const categorizeTransactionSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    category: z.string(),
    subcategory: z.string().optional(),
    applyToSimilar: z.boolean().optional().default(false),
  }),
});

// ==================== BUDGET SCHEMAS ====================

export const createBudgetSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    category: z.string().min(1),
    amount: z.number().positive(),
    period: budgetPeriod.default('monthly'),
    startDate: z.string().datetime().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().optional(),
    rollover: z.boolean().optional().default(false),
    alertEnabled: z.boolean().optional().default(true),
    alertThreshold: z.number().min(0).max(100).optional().default(80),
  }),
});

export const updateBudgetSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    period: budgetPeriod.optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().optional(),
    rollover: z.boolean().optional(),
    alertEnabled: z.boolean().optional(),
    alertThreshold: z.number().min(0).max(100).optional(),
    status: budgetStatus.optional(),
  }),
});

export const listBudgetsSchema = z.object({
  query: z.object({
    status: budgetStatus.optional(),
    period: budgetPeriod.optional(),
    category: z.string().optional(),
  }),
});

// ==================== SYNC SCHEMAS ====================

export const syncAccountsSchema = z.object({
  body: z.object({
    accountIds: z.array(z.string().cuid()).optional(), // Sync specific accounts, or all if empty
  }),
});

// ==================== DASHBOARD SCHEMAS ====================

export const dashboardQuerySchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// ==================== FINANCIAL GOAL SCHEMAS ====================

export const goalType = z.enum(['savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund']);
export const goalPriority = z.enum(['high', 'medium', 'low']);
export const goalStatus = z.enum(['active', 'paused', 'completed', 'abandoned']);

export const createGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0).optional().default(0),
    targetDate: z.string().datetime().optional(),
    type: goalType.default('savings'),
    priority: goalPriority.default('medium'),
    linkedAccountId: z.string().cuid().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().optional(),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    targetAmount: z.number().positive().optional(),
    currentAmount: z.number().min(0).optional(),
    targetDate: z.string().datetime().optional().nullable(),
    type: goalType.optional(),
    priority: goalPriority.optional(),
    linkedAccountId: z.string().cuid().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().optional(),
    status: goalStatus.optional(),
  }),
});

export const listGoalsSchema = z.object({
  query: z.object({
    status: goalStatus.optional(),
    type: goalType.optional(),
    priority: goalPriority.optional(),
  }),
});

export const addContributionSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    amount: z.number().positive('Contribution must be positive'),
    note: z.string().max(500).optional(),
    contributionDate: z.string().datetime().optional(),
    transactionId: z.string().cuid().optional(),
  }),
});

// ==================== RECURRING TRANSACTION SCHEMAS ====================

export const recurringFrequency = z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annually']);
export const recurringType = z.enum(['bill', 'subscription', 'income', 'transfer']);
export const recurringStatus = z.enum(['active', 'paused', 'ended']);

export const createRecurringSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    merchantName: z.string().max(200).optional(),
    amount: z.number().positive('Amount must be positive'),
    amountVariation: z.number().min(0).optional().default(0),
    frequency: recurringFrequency,
    dayOfMonth: z.number().min(1).max(31).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    type: recurringType,
    category: z.string().optional(),
    accountId: z.string().cuid().optional(),
    nextExpected: z.string().datetime().optional(),
    alertEnabled: z.boolean().optional().default(true),
    alertDaysBefore: z.number().min(0).max(30).optional().default(3),
  }),
});

export const updateRecurringSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    merchantName: z.string().max(200).optional().nullable(),
    amount: z.number().positive().optional(),
    amountVariation: z.number().min(0).optional(),
    frequency: recurringFrequency.optional(),
    dayOfMonth: z.number().min(1).max(31).optional().nullable(),
    dayOfWeek: z.number().min(0).max(6).optional().nullable(),
    type: recurringType.optional(),
    category: z.string().optional().nullable(),
    accountId: z.string().cuid().optional().nullable(),
    nextExpected: z.string().datetime().optional(),
    alertEnabled: z.boolean().optional(),
    alertDaysBefore: z.number().min(0).max(30).optional(),
    status: recurringStatus.optional(),
    endDate: z.string().datetime().optional().nullable(),
  }),
});

export const listRecurringSchema = z.object({
  query: z.object({
    status: recurringStatus.optional(),
    type: recurringType.optional(),
    accountId: z.string().cuid().optional(),
  }),
});

// ==================== NET WORTH SCHEMAS ====================

export const netWorthHistorySchema = z.object({
  query: z.object({
    period: z.enum(['month', 'quarter', 'year', 'all']).optional().default('year'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// ==================== TYPE EXPORTS ====================

export type LinkAccountInput = z.infer<typeof linkAccountSchema>['body'];
export type CreateManualAccountInput = z.infer<typeof createManualAccountSchema>['body'];
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>['body'];
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>['query'];
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>['body'];
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>['body'];
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>['body'];
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>['body'];
export type CreateGoalInput = z.infer<typeof createGoalSchema>['body'];
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>['body'];
export type AddContributionInput = z.infer<typeof addContributionSchema>['body'];
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>['body'];
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>['body'];
