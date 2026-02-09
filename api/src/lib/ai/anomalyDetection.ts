/**
 * Transaction Anomaly Detection
 * Detects unusual patterns in financial transactions
 */

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  merchantName?: string;
  timestamp: Date;
  userId: string;
}

export interface Anomaly {
  transactionId: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  score: number; // 0-100, higher = more anomalous
  suggestedAction?: string;
  details: Record<string, unknown>;
}

export type AnomalyType =
  | 'unusual_amount'
  | 'unusual_category'
  | 'unusual_time'
  | 'unusual_frequency'
  | 'duplicate_transaction'
  | 'new_merchant'
  | 'velocity_spike'
  | 'geographic_anomaly';

export interface UserSpendingProfile {
  avgTransactionAmount: number;
  maxTransactionAmount: number;
  stdDevAmount: number;
  commonCategories: string[];
  typicalTransactionHours: number[];
  avgDailyTransactions: number;
  frequentMerchants: string[];
}

/**
 * Detect anomalies in a set of transactions
 */
export function detectAnomalies(
  transactions: Transaction[],
  profile: UserSpendingProfile
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const transaction of transactions) {
    // Check unusual amount
    const amountAnomaly = checkUnusualAmount(transaction, profile);
    if (amountAnomaly) anomalies.push(amountAnomaly);

    // Check unusual category
    const categoryAnomaly = checkUnusualCategory(transaction, profile);
    if (categoryAnomaly) anomalies.push(categoryAnomaly);

    // Check unusual time
    const timeAnomaly = checkUnusualTime(transaction, profile);
    if (timeAnomaly) anomalies.push(timeAnomaly);

    // Check new merchant
    const merchantAnomaly = checkNewMerchant(transaction, profile);
    if (merchantAnomaly) anomalies.push(merchantAnomaly);
  }

  // Check for duplicates
  const duplicates = checkDuplicateTransactions(transactions);
  anomalies.push(...duplicates);

  // Check velocity
  const velocityAnomalies = checkVelocity(transactions, profile);
  anomalies.push(...velocityAnomalies);

  return anomalies;
}

/**
 * Check for unusually large or small amounts
 */
function checkUnusualAmount(
  transaction: Transaction,
  profile: UserSpendingProfile
): Anomaly | null {
  const zScore = Math.abs(
    (transaction.amount - profile.avgTransactionAmount) / profile.stdDevAmount
  );

  if (zScore > 3) {
    const severity = zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium';
    return {
      transactionId: transaction.id,
      type: 'unusual_amount',
      severity,
      description: `Transaction amount $${transaction.amount} is ${zScore.toFixed(1)} standard deviations from your average`,
      score: Math.min(100, zScore * 20),
      suggestedAction: severity === 'critical'
        ? 'Verify this transaction immediately'
        : 'Review this transaction for accuracy',
      details: {
        amount: transaction.amount,
        avgAmount: profile.avgTransactionAmount,
        zScore,
      },
    };
  }

  return null;
}

/**
 * Check for unusual spending category
 */
function checkUnusualCategory(
  transaction: Transaction,
  profile: UserSpendingProfile
): Anomaly | null {
  if (!profile.commonCategories.includes(transaction.category)) {
    return {
      transactionId: transaction.id,
      type: 'unusual_category',
      severity: 'low',
      description: `Transaction in uncommon category: ${transaction.category}`,
      score: 30,
      details: {
        category: transaction.category,
        commonCategories: profile.commonCategories,
      },
    };
  }

  return null;
}

/**
 * Check for transactions at unusual times
 */
function checkUnusualTime(
  transaction: Transaction,
  profile: UserSpendingProfile
): Anomaly | null {
  const hour = transaction.timestamp.getHours();

  if (!profile.typicalTransactionHours.includes(hour)) {
    // Late night transactions (12am - 5am) are more suspicious
    const isLateNight = hour >= 0 && hour <= 5;
    const severity = isLateNight ? 'medium' : 'low';

    return {
      transactionId: transaction.id,
      type: 'unusual_time',
      severity,
      description: `Transaction at unusual hour: ${hour}:00`,
      score: isLateNight ? 50 : 25,
      details: {
        transactionHour: hour,
        typicalHours: profile.typicalTransactionHours,
      },
    };
  }

  return null;
}

/**
 * Check for transactions from new merchants
 */
function checkNewMerchant(
  transaction: Transaction,
  profile: UserSpendingProfile
): Anomaly | null {
  if (
    transaction.merchantName &&
    !profile.frequentMerchants.includes(transaction.merchantName) &&
    transaction.amount > profile.avgTransactionAmount * 2
  ) {
    return {
      transactionId: transaction.id,
      type: 'new_merchant',
      severity: 'medium',
      description: `Large transaction from new merchant: ${transaction.merchantName}`,
      score: 45,
      suggestedAction: 'Verify this merchant is legitimate',
      details: {
        merchant: transaction.merchantName,
        amount: transaction.amount,
      },
    };
  }

  return null;
}

/**
 * Check for duplicate transactions
 */
function checkDuplicateTransactions(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const seen = new Map<string, Transaction>();

  for (const transaction of transactions) {
    // Create a key based on amount, merchant, and approximate time
    const timeWindow = Math.floor(transaction.timestamp.getTime() / (5 * 60 * 1000)); // 5 min window
    const key = `${transaction.amount}-${transaction.merchantName}-${timeWindow}`;

    if (seen.has(key)) {
      const original = seen.get(key)!;
      anomalies.push({
        transactionId: transaction.id,
        type: 'duplicate_transaction',
        severity: 'high',
        description: `Possible duplicate of transaction ${original.id}`,
        score: 75,
        suggestedAction: 'Review both transactions - one may be a duplicate charge',
        details: {
          originalTransaction: original.id,
          amount: transaction.amount,
          merchant: transaction.merchantName,
        },
      });
    } else {
      seen.set(key, transaction);
    }
  }

  return anomalies;
}

/**
 * Check for unusual transaction velocity
 */
function checkVelocity(
  transactions: Transaction[],
  profile: UserSpendingProfile
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Group transactions by day
  const byDay = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const day = transaction.timestamp.toISOString().split('T')[0];
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(transaction);
  }

  // Check each day for velocity spikes
  for (const [day, dayTransactions] of byDay) {
    if (dayTransactions.length > profile.avgDailyTransactions * 2) {
      anomalies.push({
        transactionId: dayTransactions[0].id,
        type: 'velocity_spike',
        severity: 'medium',
        description: `Unusual number of transactions on ${day}: ${dayTransactions.length} (avg: ${profile.avgDailyTransactions})`,
        score: 55,
        suggestedAction: 'Review all transactions from this day',
        details: {
          date: day,
          transactionCount: dayTransactions.length,
          avgDaily: profile.avgDailyTransactions,
        },
      });
    }
  }

  return anomalies;
}

/**
 * Build a spending profile from historical transactions
 */
export function buildSpendingProfile(transactions: Transaction[]): UserSpendingProfile {
  if (transactions.length === 0) {
    return {
      avgTransactionAmount: 100,
      maxTransactionAmount: 500,
      stdDevAmount: 50,
      commonCategories: [],
      typicalTransactionHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      avgDailyTransactions: 2,
      frequentMerchants: [],
    };
  }

  const amounts = transactions.map((t) => t.amount);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const maxAmount = Math.max(...amounts);
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Count categories
  const categoryCounts = new Map<string, number>();
  for (const t of transactions) {
    categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
  }
  const commonCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  // Count transaction hours
  const hourCounts = new Map<number, number>();
  for (const t of transactions) {
    const hour = t.timestamp.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const typicalHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([hour]) => hour);

  // Calculate daily average
  const days = new Set(transactions.map((t) => t.timestamp.toISOString().split('T')[0]));
  const avgDaily = transactions.length / days.size;

  // Count merchants
  const merchantCounts = new Map<string, number>();
  for (const t of transactions) {
    if (t.merchantName) {
      merchantCounts.set(t.merchantName, (merchantCounts.get(t.merchantName) || 0) + 1);
    }
  }
  const frequentMerchants = Array.from(merchantCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([merchant]) => merchant);

  return {
    avgTransactionAmount: avgAmount,
    maxTransactionAmount: maxAmount,
    stdDevAmount: stdDev || 50, // Default if only one transaction
    commonCategories,
    typicalTransactionHours: typicalHours,
    avgDailyTransactions: avgDaily,
    frequentMerchants,
  };
}

/**
 * Get anomaly summary for a user
 */
export function getAnomalySummary(anomalies: Anomaly[]): {
  totalAnomalies: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  avgScore: number;
  requiresAction: number;
} {
  const bySeverity: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const byType: Record<string, number> = {};

  let totalScore = 0;
  let requiresAction = 0;

  for (const anomaly of anomalies) {
    bySeverity[anomaly.severity]++;
    byType[anomaly.type] = (byType[anomaly.type] || 0) + 1;
    totalScore += anomaly.score;
    if (anomaly.suggestedAction) requiresAction++;
  }

  return {
    totalAnomalies: anomalies.length,
    bySeverity,
    byType,
    avgScore: anomalies.length > 0 ? totalScore / anomalies.length : 0,
    requiresAction,
  };
}
