/**
 * Agent & Partner Ecosystem
 * Multi-tier referral system and partner management
 */

import { prisma } from '../prisma';

export interface Agent {
  id: string;
  userId: string;
  tier: AgentTier;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  commissionRate: number;
  totalEarnings: number;
  referralCount: number;
  joinedAt: Date;
  specializations: string[];
  regions: string[];
  verificationStatus: 'unverified' | 'pending' | 'verified';
  performanceScore: number;
}

export type AgentTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface ReferralCode {
  code: string;
  agentId: string;
  type: 'standard' | 'promotional' | 'partner';
  discount: number;
  commission: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
}

export interface Commission {
  id: string;
  agentId: string;
  referralId: string;
  amount: number;
  type: 'direct' | 'indirect' | 'bonus';
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: Date;
  paidAt?: Date;
}

// Tier configuration
const TIER_CONFIG: Record<AgentTier, { minReferrals: number; commissionRate: number; bonuses: string[] }> = {
  bronze: {
    minReferrals: 0,
    commissionRate: 0.02,
    bonuses: ['Basic dashboard access'],
  },
  silver: {
    minReferrals: 10,
    commissionRate: 0.03,
    bonuses: ['Priority support', 'Marketing materials'],
  },
  gold: {
    minReferrals: 25,
    commissionRate: 0.04,
    bonuses: ['Dedicated account manager', 'Custom landing page'],
  },
  platinum: {
    minReferrals: 50,
    commissionRate: 0.05,
    bonuses: ['Co-branded materials', 'Quarterly bonus'],
  },
  diamond: {
    minReferrals: 100,
    commissionRate: 0.06,
    bonuses: ['Revenue share', 'VIP events', 'Advisory role'],
  },
};

/**
 * Register a new agent
 */
export async function registerAgent(
  userId: string,
  data: {
    specializations?: string[];
    regions?: string[];
  }
): Promise<Agent> {
  const agent: Agent = {
    id: `AGT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    tier: 'bronze',
    status: 'pending',
    commissionRate: TIER_CONFIG.bronze.commissionRate,
    totalEarnings: 0,
    referralCount: 0,
    joinedAt: new Date(),
    specializations: data.specializations || [],
    regions: data.regions || [],
    verificationStatus: 'unverified',
    performanceScore: 50,
  };

  // Would save to database in production
  return agent;
}

/**
 * Generate referral code for agent
 */
export function generateReferralCode(
  agentId: string,
  options?: {
    type?: 'standard' | 'promotional' | 'partner';
    discount?: number;
    maxUses?: number;
    expiresInDays?: number;
  }
): ReferralCode {
  const code = `VOR-${agentId.substring(4, 8).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  return {
    code,
    agentId,
    type: options?.type || 'standard',
    discount: options?.discount || 0,
    commission: TIER_CONFIG.bronze.commissionRate,
    maxUses: options?.maxUses,
    usedCount: 0,
    expiresAt: options?.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined,
    active: true,
  };
}

/**
 * Process referral and calculate commissions
 */
export async function processReferral(
  referralCode: string,
  newUserId: string,
  investmentAmount: number
): Promise<{
  success: boolean;
  discount: number;
  commissions: Commission[];
}> {
  // Would look up referral code in database
  const mockCode: ReferralCode = {
    code: referralCode,
    agentId: 'AGT-mock',
    type: 'standard',
    discount: 0.01,
    commission: 0.03,
    usedCount: 5,
    active: true,
  };

  // Calculate commissions (could be multi-level)
  const commissions: Commission[] = [];

  // Direct commission to referring agent
  const directCommission: Commission = {
    id: `COM-${Date.now()}`,
    agentId: mockCode.agentId,
    referralId: newUserId,
    amount: investmentAmount * mockCode.commission,
    type: 'direct',
    status: 'pending',
    createdAt: new Date(),
  };
  commissions.push(directCommission);

  // Bonus for milestones (every 10 referrals)
  if ((mockCode.usedCount + 1) % 10 === 0) {
    commissions.push({
      id: `COM-${Date.now()}-bonus`,
      agentId: mockCode.agentId,
      referralId: newUserId,
      amount: 100, // Milestone bonus
      type: 'bonus',
      status: 'pending',
      createdAt: new Date(),
    });
  }

  return {
    success: true,
    discount: mockCode.discount * investmentAmount,
    commissions,
  };
}

/**
 * Calculate and update agent tier
 */
export function calculateTier(referralCount: number): {
  currentTier: AgentTier;
  nextTier: AgentTier | null;
  referralsToNextTier: number;
  benefits: string[];
} {
  let currentTier: AgentTier = 'bronze';

  const tiers: AgentTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

  for (const tier of tiers) {
    if (referralCount >= TIER_CONFIG[tier].minReferrals) {
      currentTier = tier;
    }
  }

  const currentIndex = tiers.indexOf(currentTier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  const referralsToNextTier = nextTier
    ? TIER_CONFIG[nextTier].minReferrals - referralCount
    : 0;

  return {
    currentTier,
    nextTier,
    referralsToNextTier,
    benefits: TIER_CONFIG[currentTier].bonuses,
  };
}

/**
 * Get agent performance metrics
 */
export function getAgentPerformance(agent: Agent): {
  score: number;
  metrics: Record<string, number>;
  ranking: string;
  recommendations: string[];
} {
  // Calculate performance metrics
  const avgCommissionPerReferral = agent.referralCount > 0
    ? agent.totalEarnings / agent.referralCount
    : 0;

  const monthsActive = Math.max(1,
    (Date.now() - agent.joinedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  const referralsPerMonth = agent.referralCount / monthsActive;

  const metrics = {
    totalReferrals: agent.referralCount,
    totalEarnings: agent.totalEarnings,
    avgCommission: avgCommissionPerReferral,
    referralsPerMonth,
    conversionRate: 0.15 + Math.random() * 0.15, // Mock
  };

  // Calculate score
  let score = 50;
  if (referralsPerMonth >= 5) score += 20;
  else if (referralsPerMonth >= 2) score += 10;
  if (metrics.conversionRate >= 0.25) score += 15;
  if (agent.verificationStatus === 'verified') score += 10;
  score = Math.min(100, score);

  // Determine ranking
  let ranking: string;
  if (score >= 90) ranking = 'Top Performer';
  else if (score >= 75) ranking = 'High Performer';
  else if (score >= 50) ranking = 'Average';
  else ranking = 'Needs Improvement';

  // Generate recommendations
  const recommendations: string[] = [];
  if (agent.verificationStatus !== 'verified') {
    recommendations.push('Complete identity verification to unlock full features');
  }
  if (referralsPerMonth < 2) {
    recommendations.push('Share your referral link on social media to increase referrals');
  }
  if (agent.specializations.length < 2) {
    recommendations.push('Add more specializations to your profile');
  }

  return { score, metrics, ranking, recommendations };
}

/**
 * Get agent leaderboard
 */
export function getLeaderboard(
  period: 'week' | 'month' | 'quarter' | 'year' | 'all',
  limit: number = 10
): {
  period: string;
  leaders: Array<{
    rank: number;
    agentId: string;
    referrals: number;
    earnings: number;
    tier: AgentTier;
  }>;
} {
  // Mock leaderboard data
  const leaders = Array.from({ length: limit }, (_, i) => ({
    rank: i + 1,
    agentId: `AGT-${1000 + i}`,
    referrals: Math.floor(100 - i * 8 + Math.random() * 5),
    earnings: Math.floor((100 - i * 8) * 150 + Math.random() * 500),
    tier: i < 2 ? 'diamond' as AgentTier : i < 5 ? 'platinum' as AgentTier : 'gold' as AgentTier,
  }));

  return { period, leaders };
}

/**
 * Request commission payout
 */
export async function requestPayout(
  agentId: string,
  amount: number,
  payoutMethod: {
    type: 'bank_transfer' | 'paypal' | 'check';
    details: Record<string, string>;
  }
): Promise<{
  payoutId: string;
  status: string;
  amount: number;
  estimatedArrival: Date;
}> {
  // Validate minimum payout
  const minimumPayout = 50;
  if (amount < minimumPayout) {
    throw new Error(`Minimum payout amount is $${minimumPayout}`);
  }

  const payoutId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Processing times by method
  const processingDays: Record<string, number> = {
    bank_transfer: 3,
    paypal: 1,
    check: 7,
  };

  const estimatedArrival = new Date();
  estimatedArrival.setDate(estimatedArrival.getDate() + processingDays[payoutMethod.type]);

  return {
    payoutId,
    status: 'processing',
    amount,
    estimatedArrival,
  };
}
