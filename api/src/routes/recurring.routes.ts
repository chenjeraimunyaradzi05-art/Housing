/**
 * Recurring Transaction Routes
 * Handles recurring bills, subscriptions, and income tracking
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import {
  createRecurringSchema,
  updateRecurringSchema,
  listRecurringSchema,
} from '../schemas/financial.schema';
import { success, created, notFound, badRequest } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/recurring
 * List all recurring transactions
 */
router.get('/', validate(listRecurringSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, type, accountId } = req.query as {
    status?: string;
    type?: string;
    accountId?: string;
  };

  const recurring = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      ...(status && { status }),
      ...(type && { type }),
      ...(accountId && { accountId }),
    },
    orderBy: [{ nextExpected: 'asc' }, { name: 'asc' }],
  });

  // Transform and add computed fields
  const transformed = recurring.map((r) => ({
    ...r,
    amount: r.amount.toNumber(),
    amountVariation: r.amountVariation.toNumber(),
    confidence: r.confidence?.toNumber() || null,
    isUpcoming: r.nextExpected && new Date(r.nextExpected) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    daysUntilNext: r.nextExpected
      ? Math.ceil((new Date(r.nextExpected).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null,
  }));

  success(res, { recurring: transformed });
});

/**
 * GET /api/recurring/summary
 * Get summary of recurring transactions
 */
router.get('/summary', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId, status: 'active' },
  });

  const summary = recurring.reduce(
    (acc, r) => {
      const amount = r.amount.toNumber();
      const monthlyAmount = calculateMonthlyAmount(amount, r.frequency);

      if (r.type === 'income') {
        acc.monthlyIncome += monthlyAmount;
        acc.incomeCount++;
      } else {
        acc.monthlyExpenses += monthlyAmount;
        if (r.type === 'bill') acc.billCount++;
        if (r.type === 'subscription') acc.subscriptionCount++;
      }

      return acc;
    },
    {
      totalActive: recurring.length,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      billCount: 0,
      subscriptionCount: 0,
      incomeCount: 0,
    }
  );

  // Get upcoming in next 7 days
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = recurring.filter(
    (r) => r.nextExpected && new Date(r.nextExpected) <= nextWeek
  );

  success(res, {
    ...summary,
    netMonthly: summary.monthlyIncome - summary.monthlyExpenses,
    upcomingCount: upcoming.length,
    upcomingTotal: upcoming.reduce((sum, r) => sum + r.amount.toNumber(), 0),
  });
});

/**
 * GET /api/recurring/upcoming
 * Get recurring transactions due soon
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const days = parseInt(req.query.days as string) || 30;

  const upcomingDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const upcoming = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      status: 'active',
      nextExpected: { lte: upcomingDate },
    },
    orderBy: { nextExpected: 'asc' },
  });

  const transformed = upcoming.map((r) => ({
    ...r,
    amount: r.amount.toNumber(),
    daysUntil: r.nextExpected
      ? Math.ceil((new Date(r.nextExpected).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null,
  }));

  success(res, { upcoming: transformed });
});

/**
 * GET /api/recurring/:id
 * Get a single recurring transaction
 */
router.get('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return notFound(res, 'Recurring transaction not found');
  }

  success(res, {
    ...recurring,
    amount: recurring.amount.toNumber(),
    amountVariation: recurring.amountVariation.toNumber(),
    confidence: recurring.confidence?.toNumber() || null,
  });
});

/**
 * POST /api/recurring
 * Create a new recurring transaction
 */
router.post('/', validate(createRecurringSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    name,
    merchantName,
    amount,
    amountVariation,
    frequency,
    dayOfMonth,
    dayOfWeek,
    type,
    category,
    accountId,
    nextExpected,
    alertEnabled,
    alertDaysBefore,
  } = req.body;

  // Validate account if provided
  if (accountId) {
    const account = await prisma.userAccount.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) {
      return badRequest(res, 'Account not found');
    }
  }

  // Calculate next expected if not provided
  let computedNextExpected = nextExpected ? new Date(nextExpected) : null;
  if (!computedNextExpected) {
    computedNextExpected = calculateNextOccurrence(frequency, dayOfMonth, dayOfWeek);
  }

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId,
      name,
      merchantName,
      amount,
      amountVariation: amountVariation || 0,
      frequency,
      dayOfMonth,
      dayOfWeek,
      type,
      category,
      accountId,
      nextExpected: computedNextExpected,
      alertEnabled: alertEnabled ?? true,
      alertDaysBefore: alertDaysBefore || 3,
      isAutoDetected: false,
    },
  });

  created(res, {
    ...recurring,
    amount: recurring.amount.toNumber(),
  });
});

/**
 * PATCH /api/recurring/:id
 * Update a recurring transaction
 */
router.patch('/:id', validate(updateRecurringSchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const updates = req.body;

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return notFound(res, 'Recurring transaction not found');
  }

  // Validate account if being updated
  if (updates.accountId) {
    const account = await prisma.userAccount.findFirst({
      where: { id: updates.accountId, userId },
    });
    if (!account) {
      return badRequest(res, 'Account not found');
    }
  }

  // Handle date conversions
  if (updates.nextExpected) {
    updates.nextExpected = new Date(updates.nextExpected);
  }
  if (updates.endDate) {
    updates.endDate = new Date(updates.endDate);
  }

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: updates,
  });

  success(res, {
    ...updated,
    amount: updated.amount.toNumber(),
  });
});

/**
 * POST /api/recurring/:id/mark-paid
 * Mark a recurring transaction as paid (update next occurrence)
 */
router.post('/:id/mark-paid', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { paidDate, actualAmount } = req.body as {
    paidDate?: string;
    actualAmount?: number;
  };

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return notFound(res, 'Recurring transaction not found');
  }

  // Calculate next occurrence
  const nextExpected = calculateNextOccurrence(
    recurring.frequency,
    recurring.dayOfMonth,
    recurring.dayOfWeek
  );

  // Update amount variation if actual amount differs
  let amountVariation = recurring.amountVariation.toNumber();
  if (actualAmount !== undefined) {
    const difference = Math.abs(actualAmount - recurring.amount.toNumber());
    amountVariation = Math.max(amountVariation, difference);
  }

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: {
      lastOccurrence: paidDate ? new Date(paidDate) : new Date(),
      nextExpected,
      occurrenceCount: { increment: 1 },
      amountVariation,
    },
  });

  success(res, {
    ...updated,
    amount: updated.amount.toNumber(),
    message: 'Marked as paid, next occurrence scheduled',
  });
});

/**
 * POST /api/recurring/detect
 * Auto-detect recurring transactions from transaction history
 */
router.post('/detect', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { minOccurrences = 2, lookbackDays = 90 } = req.body as {
    minOccurrences?: number;
    lookbackDays?: number;
  };

  const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  // Get transactions grouped by merchant/name
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate },
      isHidden: false,
      pending: false,
    },
    orderBy: { date: 'asc' },
  });

  // Group by normalized merchant name
  const grouped: Record<
    string,
    Array<{ id: string; amount: number; date: Date; accountId: string }>
  > = {};

  for (const tx of transactions) {
    const key = normalizeTransactionName(tx.merchantName || tx.name);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      id: tx.id,
      amount: tx.amount.toNumber(),
      date: tx.date,
      accountId: tx.accountId,
    });
  }

  // Analyze patterns
  const detected: Array<{
    name: string;
    avgAmount: number;
    frequency: string;
    confidence: number;
    occurrences: number;
    transactions: string[];
  }> = [];

  for (const [name, txs] of Object.entries(grouped)) {
    if (txs.length < minOccurrences) continue;

    // Calculate average interval
    const intervals: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      const days = Math.round(
        (txs[i].date.getTime() - txs[i - 1].date.getTime()) / (24 * 60 * 60 * 1000)
      );
      intervals.push(days);
    }

    if (intervals.length === 0) continue;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const frequency = detectFrequency(avgInterval);

    if (!frequency) continue;

    // Calculate confidence based on interval consistency
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - stdDev * 5));

    if (confidence < 50) continue;

    const avgAmount = txs.reduce((sum, t) => sum + t.amount, 0) / txs.length;

    detected.push({
      name,
      avgAmount: Math.round(avgAmount * 100) / 100,
      frequency,
      confidence: Math.round(confidence),
      occurrences: txs.length,
      transactions: txs.map((t) => t.id),
    });
  }

  // Check which ones already exist
  const existing = await prisma.recurringTransaction.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => normalizeTransactionName(e.name)));

  const newDetected = detected.filter((d) => !existingNames.has(normalizeTransactionName(d.name)));

  success(res, {
    detected: newDetected.sort((a, b) => b.confidence - a.confidence),
    existingCount: detected.length - newDetected.length,
  });
});

/**
 * POST /api/recurring/detect/confirm
 * Confirm and create a detected recurring transaction
 */
router.post('/detect/confirm', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, avgAmount, frequency, confidence, transactions, type, category } = req.body as {
    name: string;
    avgAmount: number;
    frequency: string;
    confidence: number;
    transactions: string[];
    type?: string;
    category?: string;
  };

  // Get first transaction for account info
  const firstTx = transactions[0]
    ? await prisma.transaction.findUnique({ where: { id: transactions[0] } })
    : null;

  // Calculate next expected
  const nextExpected = calculateNextOccurrence(frequency, undefined, undefined);

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId,
      name,
      amount: avgAmount,
      frequency,
      type: type || (avgAmount < 0 ? 'income' : 'subscription'),
      category,
      accountId: firstTx?.accountId,
      isAutoDetected: true,
      confidence,
      matchedTransactionIds: transactions,
      occurrenceCount: transactions.length,
      lastOccurrence: firstTx?.date,
      nextExpected,
    },
  });

  created(res, {
    ...recurring,
    amount: recurring.amount.toNumber(),
  });
});

/**
 * DELETE /api/recurring/:id
 * Delete a recurring transaction
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
  });

  if (!recurring) {
    return notFound(res, 'Recurring transaction not found');
  }

  await prisma.recurringTransaction.delete({
    where: { id },
  });

  success(res, { message: 'Recurring transaction deleted' });
});

// ==================== HELPER FUNCTIONS ====================

function calculateMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'biweekly':
      return amount * 2.17;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'annually':
      return amount / 12;
    default:
      return amount;
  }
}

function calculateNextOccurrence(
  frequency: string,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      if (dayOfWeek !== undefined && dayOfWeek !== null) {
        const currentDay = next.getDay();
        const diff = dayOfWeek - currentDay;
        next.setDate(next.getDate() + diff);
        if (next <= now) next.setDate(next.getDate() + 7);
      }
      break;

    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
        next.setDate(Math.min(dayOfMonth, getDaysInMonth(next)));
      }
      break;

    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
        next.setDate(Math.min(dayOfMonth, getDaysInMonth(next)));
      }
      break;

    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function detectFrequency(avgDays: number): string | null {
  if (avgDays >= 5 && avgDays <= 9) return 'weekly';
  if (avgDays >= 12 && avgDays <= 18) return 'biweekly';
  if (avgDays >= 25 && avgDays <= 35) return 'monthly';
  if (avgDays >= 85 && avgDays <= 100) return 'quarterly';
  if (avgDays >= 350 && avgDays <= 380) return 'annually';
  return null;
}

function normalizeTransactionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[0-9]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default router;
