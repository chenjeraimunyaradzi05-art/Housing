/**
 * Transaction Routes
 * Handles transaction listing, search, and categorization
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import {
  listTransactionsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  categorizeTransactionSchema,
} from '../schemas/financial.schema';
import { success, created, notFound } from '../utils/response';
import { Prisma } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/transactions
 * List transactions with filtering and pagination
 */
router.get('/', validate(listTransactionsSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    accountId,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    search,
    pending,
    page = 1,
    limit = 50,
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query as {
    accountId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    pending?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'amount' | 'name';
    sortOrder?: 'asc' | 'desc';
  };

  const where: Prisma.TransactionWhereInput = {
    userId,
    isHidden: false,
    ...(accountId && { accountId }),
    ...(category && { OR: [{ category }, { personalCategory: category }] }),
    ...(startDate && { date: { gte: new Date(startDate) } }),
    ...(endDate && { date: { lte: new Date(endDate) } }),
    ...(minAmount !== undefined && { amount: { gte: minAmount } }),
    ...(maxAmount !== undefined && { amount: { lte: maxAmount } }),
    ...(pending !== undefined && { pending }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { merchantName: { contains: search, mode: 'insensitive' as const } },
        { notes: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { id: true, name: true, type: true, institutionName: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  success(res, {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/transactions/summary
 * Get transaction summary (income, expenses, by category)
 */
router.get('/summary', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  const dateFilter = {
    ...(startDate && { gte: new Date(startDate) }),
    ...(endDate && { lte: new Date(endDate) }),
  };

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      isHidden: false,
      pending: false,
      ...(Object.keys(dateFilter).length && { date: dateFilter }),
    },
    select: {
      amount: true,
      category: true,
      personalCategory: true,
    },
  });

  // Calculate totals
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, { amount: number; count: number }> = {};

  for (const tx of transactions) {
    const amount = tx.amount.toNumber();
    const category = tx.personalCategory || tx.category || 'Uncategorized';

    if (amount < 0) {
      totalIncome += Math.abs(amount);
    } else {
      totalExpenses += amount;
    }

    if (!categoryTotals[category]) {
      categoryTotals[category] = { amount: 0, count: 0 };
    }
    categoryTotals[category].amount += amount;
    categoryTotals[category].count++;
  }

  // Sort categories by amount
  const byCategory = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  success(res, {
    totalIncome,
    totalExpenses,
    netCashFlow: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    byCategory,
  });
});

/**
 * GET /api/transactions/categories
 * Get all unique categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const categories = await prisma.transaction.groupBy({
    by: ['category'],
    where: { userId, category: { not: null } },
    _count: true,
  });

  const personalCategories = await prisma.transaction.groupBy({
    by: ['personalCategory'],
    where: { userId, personalCategory: { not: null } },
    _count: true,
  });

  success(res, {
    plaidCategories: categories.map(c => ({
      name: c.category,
      count: c._count,
    })),
    personalCategories: personalCategories.map(c => ({
      name: c.personalCategory,
      count: c._count,
    })),
  });
});

/**
 * GET /api/transactions/:id
 * Get a single transaction
 */
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      account: {
        select: { id: true, name: true, type: true, institutionName: true },
      },
    },
  });

  if (!transaction) {
    return notFound(res, 'Transaction not found');
  }

  success(res, transaction);
});

/**
 * POST /api/transactions
 * Create a manual transaction
 */
router.post('/', validate(createTransactionSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { accountId, name, amount, date, category, subcategory, merchantName, notes, tags } = req.body;

  // Verify account belongs to user
  const account = await prisma.userAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    return notFound(res, 'Account not found');
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId,
      name,
      amount,
      date: new Date(date),
      category,
      subcategory,
      merchantName,
      notes,
      tags: tags || [],
    },
    include: {
      account: {
        select: { id: true, name: true, type: true },
      },
    },
  });

  created(res, transaction);
});

/**
 * PATCH /api/transactions/:id
 * Update transaction details
 */
router.patch('/:id', validate(updateTransactionSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { personalCategory, notes, tags, isHidden, budgetId } = req.body;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!transaction) {
    return notFound(res, 'Transaction not found');
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(personalCategory !== undefined && { personalCategory }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags }),
      ...(isHidden !== undefined && { isHidden }),
      ...(budgetId !== undefined && { budgetId }),
    },
  });

  success(res, updated);
});

/**
 * POST /api/transactions/:id/categorize
 * Categorize a transaction (with optional rule for similar)
 */
router.post('/:id/categorize', validate(categorizeTransactionSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { category, subcategory, applyToSimilar } = req.body;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!transaction) {
    return notFound(res, 'Transaction not found');
  }

  // Update this transaction
  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      personalCategory: category,
      subcategory,
    },
  });

  let similarUpdated = 0;

  // Apply to similar transactions if requested
  if (applyToSimilar && transaction.merchantName) {
    const result = await prisma.transaction.updateMany({
      where: {
        userId,
        merchantName: transaction.merchantName,
        personalCategory: null,
        id: { not: id },
      },
      data: {
        personalCategory: category,
        subcategory,
      },
    });
    similarUpdated = result.count;
  }

  success(res, {
    transaction: updated,
    similarUpdated,
  });
});

/**
 * DELETE /api/transactions/:id
 * Delete a manual transaction
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!transaction) {
    return notFound(res, 'Transaction not found');
  }

  // Only allow deletion of manual transactions
  if (transaction.plaidTransactionId) {
    return success(res, { message: 'Linked transactions can only be hidden, not deleted' }, 400);
  }

  await prisma.transaction.delete({ where: { id } });

  success(res, { message: 'Transaction deleted' });
});

/**
 * POST /api/transactions/bulk-categorize
 * Bulk categorize multiple transactions
 */
router.post('/bulk-categorize', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { transactionIds, category, subcategory } = req.body as {
    transactionIds: string[];
    category: string;
    subcategory?: string;
  };

  if (!transactionIds?.length) {
    return success(res, { message: 'No transactions specified' }, 400);
  }

  const result = await prisma.transaction.updateMany({
    where: {
      id: { in: transactionIds },
      userId,
    },
    data: {
      personalCategory: category,
      subcategory,
    },
  });

  success(res, {
    updated: result.count,
  });
});

export default router;
