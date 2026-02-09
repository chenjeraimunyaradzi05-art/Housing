/**
 * Budget Routes
 * Handles budget creation, tracking, and analysis
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import {
  createBudgetSchema,
  updateBudgetSchema,
  listBudgetsSchema,
} from '../schemas/financial.schema';
import { success, created, notFound, badRequest } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/budgets
 * List all budgets with spending progress
 */
router.get('/', validate(listBudgetsSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, period, category } = req.query as {
    status?: string;
    period?: string;
    category?: string;
  };

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      ...(status && { status }),
      ...(period && { period }),
      ...(category && { category }),
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate current spending for each budget
  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const { startDate, endDate } = getBudgetPeriodDates(budget.period, budget.startDate);

      // Get spending for this category in the period
      const spending = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          amount: { gt: 0 }, // Only expenses (positive amounts)
          OR: [
            { category: budget.category },
            { personalCategory: budget.category },
          ],
          isHidden: false,
        },
        _sum: { amount: true },
      });

      const spent = spending._sum.amount?.toNumber() || 0;
      const percentUsed = (spent / budget.amount.toNumber()) * 100;

      return {
        ...budget,
        spent,
        percentUsed: Math.round(percentUsed * 100) / 100,
        remaining: budget.amount.toNumber() - spent,
        isOverBudget: spent > budget.amount.toNumber(),
        periodStart: startDate,
        periodEnd: endDate,
      };
    })
  );

  success(res, { budgets: budgetsWithSpending });
});

/**
 * GET /api/budgets/summary
 * Get overall budget summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const budgets = await prisma.budget.findMany({
    where: { userId, status: 'active' },
  });

  let totalBudgeted = 0;
  let totalSpent = 0;
  let overBudgetCount = 0;

  const budgetDetails = await Promise.all(
    budgets.map(async (budget) => {
      const { startDate, endDate } = getBudgetPeriodDates(budget.period, budget.startDate);

      const spending = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          amount: { gt: 0 },
          OR: [
            { category: budget.category },
            { personalCategory: budget.category },
          ],
          isHidden: false,
        },
        _sum: { amount: true },
      });

      const budgetAmount = budget.amount.toNumber();
      const spent = spending._sum.amount?.toNumber() || 0;

      totalBudgeted += budgetAmount;
      totalSpent += spent;

      if (spent > budgetAmount) {
        overBudgetCount++;
      }

      return {
        id: budget.id,
        name: budget.name,
        category: budget.category,
        budgeted: budgetAmount,
        spent,
        percentUsed: Math.round((spent / budgetAmount) * 100),
      };
    })
  );

  success(res, {
    totalBudgeted,
    totalSpent,
    totalRemaining: totalBudgeted - totalSpent,
    percentUsed: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
    activeBudgets: budgets.length,
    overBudgetCount,
    budgets: budgetDetails.sort((a, b) => b.percentUsed - a.percentUsed),
  });
});

/**
 * GET /api/budgets/:id
 * Get a single budget with detailed spending breakdown
 */
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    return notFound(res, 'Budget not found');
  }

  const { startDate, endDate } = getBudgetPeriodDates(budget.period, budget.startDate);

  // Get transactions for this budget category
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      amount: { gt: 0 },
      OR: [
        { category: budget.category },
        { personalCategory: budget.category },
      ],
      isHidden: false,
    },
    orderBy: { date: 'desc' },
    take: 50,
  });

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount.toNumber(), 0);

  success(res, {
    ...budget,
    spent: totalSpent,
    percentUsed: Math.round((totalSpent / budget.amount.toNumber()) * 100),
    remaining: budget.amount.toNumber() - totalSpent,
    periodStart: startDate,
    periodEnd: endDate,
    recentTransactions: transactions,
  });
});

/**
 * POST /api/budgets
 * Create a new budget
 */
router.post('/', validate(createBudgetSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    category,
    amount,
    period,
    startDate,
    color,
    icon,
    rollover,
    alertEnabled,
    alertThreshold,
  } = req.body;

  // Check for existing budget with same category
  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      category,
      status: 'active',
    },
  });

  if (existing) {
    return badRequest(res, `An active budget for "${category}" already exists`);
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      name,
      category,
      amount,
      period: period || 'monthly',
      startDate: startDate ? new Date(startDate) : new Date(),
      color: color || '#3B82F6',
      icon,
      rollover: rollover || false,
      alertEnabled: alertEnabled !== false,
      alertThreshold: alertThreshold || 80,
    },
  });

  created(res, budget);
});

/**
 * PATCH /api/budgets/:id
 * Update a budget
 */
router.patch('/:id', validate(updateBudgetSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { name, amount, period, color, icon, rollover, alertEnabled, alertThreshold, status } = req.body;

  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    return notFound(res, 'Budget not found');
  }

  const updated = await prisma.budget.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(amount && { amount }),
      ...(period && { period }),
      ...(color && { color }),
      ...(icon !== undefined && { icon }),
      ...(rollover !== undefined && { rollover }),
      ...(alertEnabled !== undefined && { alertEnabled }),
      ...(alertThreshold !== undefined && { alertThreshold }),
      ...(status && { status }),
    },
  });

  success(res, updated);
});

/**
 * DELETE /api/budgets/:id
 * Delete a budget
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    return notFound(res, 'Budget not found');
  }

  await prisma.budget.delete({ where: { id } });

  success(res, { message: 'Budget deleted' });
});

/**
 * POST /api/budgets/:id/rollover
 * Manually trigger rollover for a budget
 */
router.post('/:id/rollover', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const budget = await prisma.budget.findFirst({
    where: { id, userId },
  });

  if (!budget) {
    return notFound(res, 'Budget not found');
  }

  if (!budget.rollover) {
    return badRequest(res, 'Rollover is not enabled for this budget');
  }

  const { startDate, endDate } = getBudgetPeriodDates(budget.period, budget.startDate);

  // Calculate unspent amount
  const spending = await prisma.transaction.aggregate({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      amount: { gt: 0 },
      OR: [
        { category: budget.category },
        { personalCategory: budget.category },
      ],
      isHidden: false,
    },
    _sum: { amount: true },
  });

  const spent = spending._sum.amount?.toNumber() || 0;
  const remaining = Math.max(0, budget.amount.toNumber() - spent);

  const updated = await prisma.budget.update({
    where: { id },
    data: {
      rolloverAmount: remaining,
      startDate: getNextPeriodStart(budget.period),
    },
  });

  success(res, {
    budget: updated,
    rolledOver: remaining,
  });
});

/**
 * GET /api/budgets/categories/suggested
 * Get suggested budget categories based on spending
 */
router.get('/categories/suggested', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Get spending by category for the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const categorySpending = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      userId,
      date: { gte: threeMonthsAgo },
      amount: { gt: 0 },
      category: { not: null },
      isHidden: false,
    },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
    take: 10,
  });

  // Get existing budget categories
  const existingBudgets = await prisma.budget.findMany({
    where: { userId, status: 'active' },
    select: { category: true },
  });
  const existingCategories = new Set(existingBudgets.map(b => b.category));

  const suggestions = categorySpending
    .filter(c => c.category && !existingCategories.has(c.category))
    .map(c => ({
      category: c.category,
      monthlyAverage: Math.round((c._sum.amount?.toNumber() || 0) / 3),
      transactionCount: c._count,
      suggestedBudget: Math.round(((c._sum.amount?.toNumber() || 0) / 3) * 1.1), // 10% buffer
    }));

  success(res, { suggestions });
});

// ==================== HELPER FUNCTIONS ====================

function getBudgetPeriodDates(period: string, startDate: Date): { startDate: Date; endDate: Date } {
  const now = new Date();
  const start = new Date(startDate);
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case 'weekly':
      // Find the most recent period start
      const weeksSinceStart = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      periodStart = new Date(start.getTime() + weeksSinceStart * 7 * 24 * 60 * 60 * 1000);
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      break;

    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), start.getDate());
      if (periodStart > now) {
        periodStart.setMonth(periodStart.getMonth() - 1);
      }
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, start.getDate() - 1, 23, 59, 59);
      break;

    case 'quarterly':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      periodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      periodEnd = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59);
      break;

    case 'yearly':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;

    default:
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  return { startDate: periodStart, endDate: periodEnd };
}

function getNextPeriodStart(period: string): Date {
  const now = new Date();

  switch (period) {
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    case 'quarterly':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), (currentQuarter + 1) * 3, 1);
    case 'yearly':
      return new Date(now.getFullYear() + 1, 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}

export default router;
