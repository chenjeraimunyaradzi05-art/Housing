/**
 * Net Worth Snapshot Routes
 * Handles net worth history tracking and trend analysis
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { netWorthHistorySchema } from '../schemas/financial.schema';
import { success, created } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/networth/history
 * Get net worth history for trend analysis
 */
router.get('/history', validate(netWorthHistorySchema), async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { period, startDate, endDate } = req.query as {
    period?: string;
    startDate?: string;
    endDate?: string;
  };

  // Calculate date range based on period
  let fromDate: Date;
  const toDate = endDate ? new Date(endDate) : new Date();

  if (startDate) {
    fromDate = new Date(startDate);
  } else {
    switch (period) {
      case 'month':
        fromDate = new Date(toDate);
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;
      case 'quarter':
        fromDate = new Date(toDate);
        fromDate.setMonth(fromDate.getMonth() - 3);
        break;
      case 'year':
        fromDate = new Date(toDate);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      case 'all':
      default:
        fromDate = new Date(0); // Beginning of time
        break;
    }
  }

  const snapshots = await prisma.netWorthSnapshot.findMany({
    where: {
      userId,
      snapshotDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: { snapshotDate: 'asc' },
  });

  // Transform decimal fields
  const transformed = snapshots.map((s) => ({
    id: s.id,
    date: s.snapshotDate,
    netWorth: s.netWorth.toNumber(),
    totalAssets: s.totalAssets.toNumber(),
    totalDebt: s.totalDebt.toNumber(),
    breakdown: {
      cash: s.cashBalance.toNumber(),
      investments: s.investmentBalance.toNumber(),
      property: s.propertyValue.toNumber(),
      creditDebt: s.creditDebt.toNumber(),
      loanDebt: s.loanDebt.toNumber(),
      other: s.otherAssets.toNumber(),
    },
    accountCount: s.accountCount,
  }));

  // Calculate change metrics
  const change = transformed.length >= 2
    ? {
        absolute: transformed[transformed.length - 1].netWorth - transformed[0].netWorth,
        percentage:
          transformed[0].netWorth !== 0
            ? ((transformed[transformed.length - 1].netWorth - transformed[0].netWorth) /
                Math.abs(transformed[0].netWorth)) *
              100
            : 0,
        periodStart: transformed[0].date,
        periodEnd: transformed[transformed.length - 1].date,
      }
    : null;

  success(res, {
    snapshots: transformed,
    change,
    period,
  });
});

/**
 * GET /api/networth/current
 * Get current net worth with breakdown
 */
router.get('/current', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Calculate current net worth from accounts
  const accounts = await prisma.userAccount.findMany({
    where: { userId, status: 'active', includeInNetWorth: true },
  });

  const breakdown = accounts.reduce(
    (acc, account) => {
      const balance = account.currentBalance?.toNumber() || 0;

      switch (account.type) {
        case 'checking':
        case 'savings':
          acc.cash += balance;
          break;
        case 'investment':
          acc.investments += balance;
          break;
        case 'credit':
          acc.creditDebt += Math.abs(balance);
          break;
        case 'loan':
          acc.loanDebt += Math.abs(balance);
          break;
        default:
          if (balance >= 0) {
            acc.other += balance;
          } else {
            acc.loanDebt += Math.abs(balance);
          }
      }

      return acc;
    },
    {
      cash: 0,
      investments: 0,
      property: 0,
      creditDebt: 0,
      loanDebt: 0,
      other: 0,
    }
  );

  const totalAssets = breakdown.cash + breakdown.investments + breakdown.property + breakdown.other;
  const totalDebt = breakdown.creditDebt + breakdown.loanDebt;
  const netWorth = totalAssets - totalDebt;

  // Get last snapshot for comparison
  const lastSnapshot = await prisma.netWorthSnapshot.findFirst({
    where: { userId },
    orderBy: { snapshotDate: 'desc' },
  });

  const change = lastSnapshot
    ? {
        absolute: netWorth - lastSnapshot.netWorth.toNumber(),
        percentage:
          lastSnapshot.netWorth.toNumber() !== 0
            ? ((netWorth - lastSnapshot.netWorth.toNumber()) /
                Math.abs(lastSnapshot.netWorth.toNumber())) *
              100
            : 0,
        since: lastSnapshot.snapshotDate,
      }
    : null;

  success(res, {
    netWorth,
    totalAssets,
    totalDebt,
    breakdown,
    accountCount: accounts.length,
    change,
  });
});

/**
 * POST /api/networth/snapshot
 * Create a new net worth snapshot (manual or scheduled)
 */
router.post('/snapshot', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Calculate current net worth from accounts
  const accounts = await prisma.userAccount.findMany({
    where: { userId, status: 'active', includeInNetWorth: true },
  });

  const breakdown = accounts.reduce(
    (acc, account) => {
      const balance = account.currentBalance?.toNumber() || 0;

      switch (account.type) {
        case 'checking':
        case 'savings':
          acc.cash += balance;
          break;
        case 'investment':
          acc.investments += balance;
          break;
        case 'credit':
          acc.creditDebt += Math.abs(balance);
          break;
        case 'loan':
          acc.loanDebt += Math.abs(balance);
          break;
        default:
          if (balance >= 0) {
            acc.other += balance;
          } else {
            acc.loanDebt += Math.abs(balance);
          }
      }

      return acc;
    },
    {
      cash: 0,
      investments: 0,
      property: 0,
      creditDebt: 0,
      loanDebt: 0,
      other: 0,
    }
  );

  const totalAssets = breakdown.cash + breakdown.investments + breakdown.property + breakdown.other;
  const totalDebt = breakdown.creditDebt + breakdown.loanDebt;
  const netWorth = totalAssets - totalDebt;

  // Use start of day for deduplication
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert snapshot for today
  const snapshot = await prisma.netWorthSnapshot.upsert({
    where: {
      userId_snapshotDate: { userId, snapshotDate: today },
    },
    create: {
      userId,
      snapshotDate: today,
      totalAssets,
      totalDebt,
      netWorth,
      cashBalance: breakdown.cash,
      investmentBalance: breakdown.investments,
      propertyValue: breakdown.property,
      creditDebt: breakdown.creditDebt,
      loanDebt: breakdown.loanDebt,
      otherAssets: breakdown.other,
      accountCount: accounts.length,
    },
    update: {
      totalAssets,
      totalDebt,
      netWorth,
      cashBalance: breakdown.cash,
      investmentBalance: breakdown.investments,
      propertyValue: breakdown.property,
      creditDebt: breakdown.creditDebt,
      loanDebt: breakdown.loanDebt,
      otherAssets: breakdown.other,
      accountCount: accounts.length,
    },
  });

  created(res, {
    id: snapshot.id,
    date: snapshot.snapshotDate,
    netWorth: snapshot.netWorth.toNumber(),
    totalAssets: snapshot.totalAssets.toNumber(),
    totalDebt: snapshot.totalDebt.toNumber(),
    message: 'Net worth snapshot created',
  });
});

/**
 * GET /api/networth/trends
 * Get net worth trend analysis
 */
router.get('/trends', async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Get snapshots for the last year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const snapshots = await prisma.netWorthSnapshot.findMany({
    where: {
      userId,
      snapshotDate: { gte: oneYearAgo },
    },
    orderBy: { snapshotDate: 'asc' },
  });

  if (snapshots.length < 2) {
    return success(res, {
      message: 'Not enough data for trend analysis',
      hasData: false,
    });
  }

  // Calculate monthly changes
  const monthlyData: Record<string, { netWorth: number; assets: number; debt: number }> = {};

  for (const snapshot of snapshots) {
    const monthKey = snapshot.snapshotDate.toISOString().slice(0, 7); // YYYY-MM
    monthlyData[monthKey] = {
      netWorth: snapshot.netWorth.toNumber(),
      assets: snapshot.totalAssets.toNumber(),
      debt: snapshot.totalDebt.toNumber(),
    };
  }

  const months = Object.keys(monthlyData).sort();
  const monthlyChanges = [];

  for (let i = 1; i < months.length; i++) {
    const prev = monthlyData[months[i - 1]];
    const curr = monthlyData[months[i]];
    monthlyChanges.push({
      month: months[i],
      change: curr.netWorth - prev.netWorth,
      percentChange: prev.netWorth !== 0 ? ((curr.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100 : 0,
    });
  }

  // Calculate averages
  const avgMonthlyChange =
    monthlyChanges.reduce((sum, m) => sum + m.change, 0) / monthlyChanges.length;

  // Calculate best/worst months
  const bestMonth = [...monthlyChanges].sort((a, b) => b.change - a.change)[0];
  const worstMonth = [...monthlyChanges].sort((a, b) => a.change - b.change)[0];

  // Overall trend
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const overallChange = last.netWorth.toNumber() - first.netWorth.toNumber();
  const overallPercentChange =
    first.netWorth.toNumber() !== 0
      ? (overallChange / Math.abs(first.netWorth.toNumber())) * 100
      : 0;

  success(res, {
    hasData: true,
    overall: {
      change: overallChange,
      percentChange: Math.round(overallPercentChange * 100) / 100,
      periodMonths: months.length,
      startingNetWorth: first.netWorth.toNumber(),
      currentNetWorth: last.netWorth.toNumber(),
    },
    monthly: {
      averageChange: Math.round(avgMonthlyChange * 100) / 100,
      bestMonth,
      worstMonth,
      data: monthlyChanges,
    },
    projection: {
      oneMonth: last.netWorth.toNumber() + avgMonthlyChange,
      threeMonths: last.netWorth.toNumber() + avgMonthlyChange * 3,
      sixMonths: last.netWorth.toNumber() + avgMonthlyChange * 6,
      oneYear: last.netWorth.toNumber() + avgMonthlyChange * 12,
    },
  });
});

export default router;
