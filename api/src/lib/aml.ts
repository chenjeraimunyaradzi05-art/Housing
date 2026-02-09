/**
 * AML (Anti-Money Laundering) Transaction Monitoring
 * Basic rules-based monitoring for suspicious activity
 */

import prisma from './prisma';
import { auditLog } from './auditLog';
import { Request } from 'express';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'PENDING' | 'UNDER_REVIEW' | 'CLEARED' | 'ESCALATED' | 'REPORTED';
export type AlertType =
  | 'LARGE_TRANSACTION'
  | 'RAPID_TRANSACTIONS'
  | 'UNUSUAL_PATTERN'
  | 'HIGH_RISK_COUNTRY'
  | 'STRUCTURING'
  | 'ROUND_AMOUNTS'
  | 'NEW_ACCOUNT_ACTIVITY';

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'investment' | 'transfer';
  currency: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface AMLAlert {
  userId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  description: string;
  transactionIds: string[];
  ruleId: string;
  details: Record<string, any>;
}

// AML Rule Thresholds (configurable)
const AML_RULES = {
  // Large single transaction threshold
  LARGE_TRANSACTION_THRESHOLD: 10000, // $10,000

  // Rapid transactions: max transactions in time window
  RAPID_TRANSACTION_COUNT: 5,
  RAPID_TRANSACTION_WINDOW_HOURS: 1,

  // Structuring detection: multiple transactions just under threshold
  STRUCTURING_THRESHOLD: 9000, // Just under $10,000
  STRUCTURING_COUNT: 3,
  STRUCTURING_WINDOW_HOURS: 24,

  // New account high activity
  NEW_ACCOUNT_DAYS: 30,
  NEW_ACCOUNT_THRESHOLD: 5000,

  // Round amount detection
  ROUND_AMOUNT_TOLERANCE: 0.01,
  ROUND_AMOUNT_THRESHOLD: 1000,

  // High-risk countries (example list)
  HIGH_RISK_COUNTRIES: ['AF', 'IR', 'KP', 'SY', 'YE'],
};

/**
 * Analyze a transaction for AML violations
 */
export async function analyzeTransaction(
  req: Request,
  transaction: Transaction
): Promise<AMLAlert[]> {
  const alerts: AMLAlert[] = [];

  try {
    // Rule 1: Large Transaction
    if (transaction.amount >= AML_RULES.LARGE_TRANSACTION_THRESHOLD) {
      alerts.push({
        userId: transaction.userId,
        alertType: 'LARGE_TRANSACTION',
        severity: transaction.amount >= 50000 ? 'HIGH' : 'MEDIUM',
        description: `Large transaction of ${formatCurrency(transaction.amount)}`,
        transactionIds: [transaction.id],
        ruleId: 'RULE_001',
        details: { amount: transaction.amount, threshold: AML_RULES.LARGE_TRANSACTION_THRESHOLD },
      });
    }

    // Rule 2: Rapid Transactions
    const rapidCheck = await checkRapidTransactions(transaction.userId);
    if (rapidCheck.isViolation) {
      alerts.push({
        userId: transaction.userId,
        alertType: 'RAPID_TRANSACTIONS',
        severity: 'MEDIUM',
        description: `${rapidCheck.count} transactions in ${AML_RULES.RAPID_TRANSACTION_WINDOW_HOURS} hour(s)`,
        transactionIds: rapidCheck.transactionIds,
        ruleId: 'RULE_002',
        details: {
          count: rapidCheck.count,
          window: AML_RULES.RAPID_TRANSACTION_WINDOW_HOURS,
          threshold: AML_RULES.RAPID_TRANSACTION_COUNT,
        },
      });
    }

    // Rule 3: Structuring Detection
    const structuringCheck = await checkStructuring(transaction.userId);
    if (structuringCheck.isViolation) {
      alerts.push({
        userId: transaction.userId,
        alertType: 'STRUCTURING',
        severity: 'HIGH',
        description: `Potential structuring: ${structuringCheck.count} transactions just under reporting threshold`,
        transactionIds: structuringCheck.transactionIds,
        ruleId: 'RULE_003',
        details: {
          count: structuringCheck.count,
          totalAmount: structuringCheck.totalAmount,
        },
      });
    }

    // Rule 4: New Account High Activity
    const newAccountCheck = await checkNewAccountActivity(transaction.userId, transaction.amount);
    if (newAccountCheck.isViolation) {
      alerts.push({
        userId: transaction.userId,
        alertType: 'NEW_ACCOUNT_ACTIVITY',
        severity: 'MEDIUM',
        description: `High activity on new account (${newAccountCheck.accountAgeDays} days old)`,
        transactionIds: [transaction.id],
        ruleId: 'RULE_004',
        details: {
          accountAgeDays: newAccountCheck.accountAgeDays,
          amount: transaction.amount,
        },
      });
    }

    // Rule 5: Round Amounts
    if (isRoundAmount(transaction.amount) && transaction.amount >= AML_RULES.ROUND_AMOUNT_THRESHOLD) {
      alerts.push({
        userId: transaction.userId,
        alertType: 'ROUND_AMOUNTS',
        severity: 'LOW',
        description: `Round amount transaction: ${formatCurrency(transaction.amount)}`,
        transactionIds: [transaction.id],
        ruleId: 'RULE_005',
        details: { amount: transaction.amount },
      });
    }

    // Create alerts in database
    for (const alert of alerts) {
      await createAMLAlert(req, alert);
    }

    return alerts;
  } catch (error) {
    console.error('Error analyzing transaction for AML:', error);
    return [];
  }
}

/**
 * Check for rapid transactions
 */
async function checkRapidTransactions(userId: string): Promise<{
  isViolation: boolean;
  count: number;
  transactionIds: string[];
}> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - AML_RULES.RAPID_TRANSACTION_WINDOW_HOURS);

  const transactions = await prisma.aMLTransaction.findMany({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
    select: { id: true },
  });

  return {
    isViolation: transactions.length >= AML_RULES.RAPID_TRANSACTION_COUNT,
    count: transactions.length,
    transactionIds: transactions.map(t => t.id),
  };
}

/**
 * Check for structuring (smurfing)
 */
async function checkStructuring(userId: string): Promise<{
  isViolation: boolean;
  count: number;
  totalAmount: number;
  transactionIds: string[];
}> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - AML_RULES.STRUCTURING_WINDOW_HOURS);

  const transactions = await prisma.aMLTransaction.findMany({
    where: {
      userId,
      createdAt: { gte: windowStart },
      amount: {
        gte: AML_RULES.STRUCTURING_THRESHOLD * 0.8, // 80% of threshold
        lt: AML_RULES.LARGE_TRANSACTION_THRESHOLD,
      },
    },
    select: { id: true, amount: true },
  });

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);

  return {
    isViolation: transactions.length >= AML_RULES.STRUCTURING_COUNT,
    count: transactions.length,
    totalAmount,
    transactionIds: transactions.map(t => t.id),
  };
}

/**
 * Check for unusual activity on new accounts
 */
async function checkNewAccountActivity(
  userId: string,
  transactionAmount: number
): Promise<{
  isViolation: boolean;
  accountAgeDays: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (!user) {
    return { isViolation: false, accountAgeDays: 0 };
  }

  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    isViolation:
      accountAgeDays <= AML_RULES.NEW_ACCOUNT_DAYS &&
      transactionAmount >= AML_RULES.NEW_ACCOUNT_THRESHOLD,
    accountAgeDays,
  };
}

/**
 * Check if amount is suspiciously round
 */
function isRoundAmount(amount: number): boolean {
  const roundFactors = [1000, 500, 100];
  for (const factor of roundFactors) {
    if (Math.abs(amount % factor) < AML_RULES.ROUND_AMOUNT_TOLERANCE) {
      return true;
    }
  }
  return false;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Create an AML alert in the database
 */
async function createAMLAlert(req: Request, alert: AMLAlert): Promise<string> {
  const created = await prisma.aMLAlert.create({
    data: {
      userId: alert.userId,
      alertType: alert.alertType,
      severity: alert.severity,
      status: 'PENDING',
      description: alert.description,
      transactionIds: alert.transactionIds,
      ruleId: alert.ruleId,
      details: alert.details,
    },
  });

  // Log critical alerts
  if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
    console.warn(`[AML ALERT] ${alert.severity}: ${alert.description} for user ${alert.userId}`);
  }

  return created.id;
}

/**
 * Record a transaction for AML monitoring
 */
export async function recordTransaction(
  req: Request,
  transaction: Omit<Transaction, 'id' | 'timestamp'>
): Promise<{ transactionId: string; alerts: AMLAlert[] }> {
  // Create transaction record
  const record = await prisma.aMLTransaction.create({
    data: {
      userId: transaction.userId,
      amount: transaction.amount,
      transactionType: transaction.type,
      currency: transaction.currency,
      metadata: transaction.metadata || {},
    },
  });

  // Analyze for AML violations
  const alerts = await analyzeTransaction(req, {
    ...transaction,
    id: record.id,
    timestamp: record.createdAt,
  });

  return { transactionId: record.id, alerts };
}

/**
 * Get pending AML alerts (admin only)
 */
export async function getPendingAlerts(limit: number = 50, offset: number = 0) {
  const [alerts, total] = await Promise.all([
    prisma.aMLAlert.findMany({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            kycStatus: true,
          },
        },
      },
    }),
    prisma.aMLAlert.count({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    }),
  ]);

  return { alerts, total, limit, offset };
}

/**
 * Update alert status (admin only)
 */
export async function updateAlertStatus(
  req: Request,
  alertId: string,
  status: AlertStatus,
  reviewNotes?: string
): Promise<void> {
  const alert = await prisma.aMLAlert.update({
    where: { id: alertId },
    data: {
      status,
      reviewedAt: new Date(),
      reviewNotes,
    },
  });

  await auditLog(req, 'SENSITIVE_DATA_ACCESSED', {
    resourceType: 'AMLAlert',
    resourceId: alertId,
    details: { status, reviewNotes },
  });
}

/**
 * Get user's transaction history for review
 */
export async function getUserTransactionHistory(userId: string, days: number = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return prisma.aMLTransaction.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Check if user has any active AML alerts
 */
export async function hasActiveAlerts(userId: string): Promise<boolean> {
  const count = await prisma.aMLAlert.count({
    where: {
      userId,
      status: { in: ['PENDING', 'UNDER_REVIEW', 'ESCALATED'] },
    },
  });
  return count > 0;
}
