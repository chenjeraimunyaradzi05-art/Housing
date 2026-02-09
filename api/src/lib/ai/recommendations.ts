/**
 * Investment Recommendation Engine
 * AI-powered matching of users with investment opportunities
 */

import { prisma } from '../prisma';

export interface UserInvestmentProfile {
  userId: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long'; // <2yr, 2-5yr, >5yr
  preferredPropertyTypes: string[];
  preferredLocations: string[];
  minInvestment: number;
  maxInvestment: number;
  targetReturn: number; // Annual percentage
  liquidityPreference: 'high' | 'medium' | 'low';
}

export interface InvestmentRecommendation {
  poolId: string;
  poolName: string;
  score: number; // 0-100 match score
  reasons: RecommendationReason[];
  projectedReturn: number;
  riskLevel: string;
  minimumInvestment: number;
}

export interface RecommendationReason {
  factor: string;
  score: number;
  description: string;
}

/**
 * Generate investment recommendations for a user
 */
export async function generateRecommendations(
  userId: string,
  limit: number = 10
): Promise<InvestmentRecommendation[]> {
  // Get user profile and preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      investments: {
        include: {
          pool: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get all available pools
  const pools = await prisma.coInvestmentPool.findMany({
    where: {
      status: 'OPEN',
    },
    include: {
      investors: true,
    },
  });

  // Build user profile from history or defaults
  const profile = buildUserProfile(user);

  // Score each pool
  const scoredPools = pools.map((pool) => ({
    pool,
    ...calculatePoolScore(pool, profile),
  }));

  // Sort by score and return top recommendations
  const recommendations = scoredPools
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((scored) => ({
      poolId: scored.pool.id,
      poolName: scored.pool.name,
      score: scored.score,
      reasons: scored.reasons,
      projectedReturn: Number(scored.pool.expectedReturn) || 8,
      riskLevel: scored.pool.riskLevel || 'moderate',
      minimumInvestment: Number(scored.pool.minInvestment),
    }));

  return recommendations;
}

/**
 * Build user investment profile from history and preferences
 */
function buildUserProfile(user: any): UserInvestmentProfile {
  // Analyze past investments to determine preferences
  const investments = user.investments || [];

  // Default profile
  const profile: UserInvestmentProfile = {
    userId: user.id,
    riskTolerance: 'moderate',
    investmentHorizon: 'medium',
    preferredPropertyTypes: [],
    preferredLocations: [],
    minInvestment: 1000,
    maxInvestment: 100000,
    targetReturn: 8,
    liquidityPreference: 'medium',
  };

  // If user has investment history, analyze it
  if (investments.length > 0) {
    const amounts = investments.map((i: any) => i.amount);
    profile.minInvestment = Math.min(...amounts);
    profile.maxInvestment = Math.max(...amounts) * 2;

    // Extract preferred property types
    const propertyTypes = investments
      .filter((i: any) => i.pool?.property?.propertyType)
      .map((i: any) => i.pool.property.propertyType);
    profile.preferredPropertyTypes = [...new Set(propertyTypes)] as string[];

    // Extract preferred locations
    const locations = investments
      .filter((i: any) => i.pool?.property?.state)
      .map((i: any) => i.pool.property.state);
    profile.preferredLocations = [...new Set(locations)] as string[];
  }

  return profile;
}

/**
 * Calculate match score for a pool
 */
function calculatePoolScore(
  pool: any,
  profile: UserInvestmentProfile
): { score: number; reasons: RecommendationReason[] } {
  const reasons: RecommendationReason[] = [];
  let totalScore = 0;

  // Investment amount fit (0-25 points)
  if (pool.minimumInvestment >= profile.minInvestment &&
      pool.minimumInvestment <= profile.maxInvestment) {
    const amountScore = 25;
    totalScore += amountScore;
    reasons.push({
      factor: 'Investment Amount',
      score: amountScore,
      description: 'Minimum investment fits your budget',
    });
  }

  // Return potential (0-25 points)
  const targetReturn = pool.targetReturn || 8;
  if (targetReturn >= profile.targetReturn) {
    const returnScore = Math.min(25, (targetReturn / profile.targetReturn) * 20);
    totalScore += returnScore;
    reasons.push({
      factor: 'Expected Return',
      score: Math.round(returnScore),
      description: `${targetReturn}% projected return meets your target`,
    });
  }

  // Risk alignment (0-20 points)
  const riskScores: Record<string, Record<string, number>> = {
    conservative: { low: 20, moderate: 10, high: 0 },
    moderate: { low: 15, moderate: 20, high: 10 },
    aggressive: { low: 5, moderate: 15, high: 20 },
  };
  const poolRisk = pool.riskLevel?.toLowerCase() || 'moderate';
  const riskScore = riskScores[profile.riskTolerance]?.[poolRisk] || 10;
  totalScore += riskScore;
  reasons.push({
    factor: 'Risk Alignment',
    score: riskScore,
    description: `${poolRisk} risk level matches your ${profile.riskTolerance} tolerance`,
  });

  // Property type preference (0-15 points)
  if (pool.property) {
    if (profile.preferredPropertyTypes.length === 0 ||
        profile.preferredPropertyTypes.includes(pool.property.propertyType)) {
      totalScore += 15;
      reasons.push({
        factor: 'Property Type',
        score: 15,
        description: `${pool.property.propertyType} matches your preferences`,
      });
    }
  }

  // Location preference (0-15 points)
  if (pool.property) {
    if (profile.preferredLocations.length === 0 ||
        profile.preferredLocations.includes(pool.property.state)) {
      totalScore += 15;
      reasons.push({
        factor: 'Location',
        score: 15,
        description: `Property in ${pool.property.state} matches your preferences`,
      });
    }
  }

  return { score: Math.min(100, totalScore), reasons };
}

/**
 * Get similar investments to one the user has already made
 */
export async function getSimilarInvestments(
  investmentId: string,
  limit: number = 5
): Promise<InvestmentRecommendation[]> {
  const investment = await prisma.coInvestmentInvestor.findUnique({
    where: { id: investmentId },
    include: {
      pool: true,
    },
  });

  if (!investment?.pool) {
    return [];
  }

  // Find similar pools
  const similarPools = await prisma.coInvestmentPool.findMany({
    where: {
      status: 'OPEN',
      id: { not: investment.pool.id },
      propertyType: investment.pool.propertyType || undefined,
    },
    take: limit,
  });

  return similarPools.map((pool) => ({
    poolId: pool.id,
    poolName: pool.name,
    score: 75 + Math.random() * 20, // Simplified similarity score
    reasons: [
      {
        factor: 'Similar Investment',
        score: 80,
        description: 'Similar to your previous investment',
      },
    ],
    projectedReturn: Number(pool.expectedReturn) || 8,
    riskLevel: pool.riskLevel || 'moderate',
    minimumInvestment: Number(pool.minInvestment),
  }));
}
