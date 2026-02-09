/**
 * AI-Powered Financial Insights Generator
 * Analyzes user financial data to provide actionable insights
 */

import { prisma } from '../prisma';

export interface FinancialInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: string;
  metrics?: Record<string, number | string>;
  createdAt: Date;
}

export type InsightType =
  | 'spending_trend'
  | 'investment_opportunity'
  | 'budget_alert'
  | 'savings_goal'
  | 'portfolio_health'
  | 'income_analysis'
  | 'debt_management'
  | 'tax_optimization'
  | 'risk_assessment';

export interface UserFinancialSummary {
  userId: string;
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  investmentReturns: number;
  savingsRate: number;
  monthlySpendingByCategory: Record<string, number>;
  portfolioValue: number;
  diversificationScore: number;
}

/**
 * Generate comprehensive financial insights for a user
 */
export async function generateFinancialInsights(
  userId: string
): Promise<FinancialInsight[]> {
  const summary = await calculateFinancialSummary(userId);
  const insights: FinancialInsight[] = [];

  // Analyze savings rate
  insights.push(...analyzeSavingsRate(summary));

  // Analyze spending patterns
  insights.push(...analyzeSpendingPatterns(summary));

  // Analyze investment performance
  insights.push(...analyzeInvestmentPerformance(summary));

  // Analyze portfolio health
  insights.push(...analyzePortfolioHealth(summary));

  // Generate opportunity insights
  insights.push(...identifyOpportunities(summary));

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

/**
 * Calculate financial summary for a user
 */
async function calculateFinancialSummary(
  userId: string
): Promise<UserFinancialSummary> {
  // Get user's investments
  const investments = await prisma.coInvestmentInvestor.findMany({
    where: { userId },
    include: { pool: true },
  });

  const totalInvestments = investments.reduce((sum: number, inv) => sum + Number(inv.amountInvested), 0);
  const portfolioValue = investments.reduce((sum: number, inv) => {
    // Calculate current value based on pool performance
    const returnRate = Number(inv.pool?.expectedReturn) || 0;
    const monthsInvested = Math.floor(
      (Date.now() - inv.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    const currentValue = Number(inv.amountInvested) * (1 + (returnRate / 100) * (monthsInvested / 12));
    return sum + currentValue;
  }, 0);

  const investmentReturns = portfolioValue - totalInvestments;

  // Get property investments for diversification
  const propertyTypes = new Set(investments.map((inv: any) => inv.pool?.propertyType).filter(Boolean));
  const diversificationScore = Math.min(100, propertyTypes.size * 20);

  // Mock income/expense data (would come from bank connections)
  const mockMonthlyIncome = 8000;
  const mockMonthlyExpenses = 5000;
  const savingsRate = ((mockMonthlyIncome - mockMonthlyExpenses) / mockMonthlyIncome) * 100;

  return {
    userId,
    totalIncome: mockMonthlyIncome,
    totalExpenses: mockMonthlyExpenses,
    totalInvestments,
    investmentReturns,
    savingsRate,
    monthlySpendingByCategory: {
      Housing: 1800,
      Food: 600,
      Transportation: 400,
      Entertainment: 300,
      Utilities: 200,
      Shopping: 500,
      Healthcare: 150,
      Other: 1050,
    },
    portfolioValue,
    diversificationScore,
  };
}

/**
 * Analyze savings rate
 */
function analyzeSavingsRate(summary: UserFinancialSummary): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  if (summary.savingsRate >= 30) {
    insights.push({
      id: `savings-${Date.now()}`,
      type: 'savings_goal',
      title: 'Excellent Savings Rate!',
      description: `You're saving ${summary.savingsRate.toFixed(1)}% of your income, which is above the recommended 20%.`,
      impact: 'positive',
      priority: 'low',
      actionable: true,
      suggestedAction: 'Consider increasing your real estate investment allocation.',
      metrics: { savingsRate: summary.savingsRate },
      createdAt: new Date(),
    });
  } else if (summary.savingsRate >= 20) {
    insights.push({
      id: `savings-${Date.now()}`,
      type: 'savings_goal',
      title: 'Good Savings Progress',
      description: `You're saving ${summary.savingsRate.toFixed(1)}% of your income, meeting the recommended target.`,
      impact: 'positive',
      priority: 'medium',
      actionable: false,
      createdAt: new Date(),
    });
  } else if (summary.savingsRate >= 10) {
    insights.push({
      id: `savings-${Date.now()}`,
      type: 'savings_goal',
      title: 'Room for Savings Improvement',
      description: `Your savings rate of ${summary.savingsRate.toFixed(1)}% is below the recommended 20%. Small changes can make a big difference.`,
      impact: 'neutral',
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Review your spending categories to identify potential savings.',
      metrics: { savingsRate: summary.savingsRate, target: 20 },
      createdAt: new Date(),
    });
  } else {
    insights.push({
      id: `savings-${Date.now()}`,
      type: 'budget_alert',
      title: 'Low Savings Rate Alert',
      description: `Your savings rate of ${summary.savingsRate.toFixed(1)}% needs attention. Building savings is crucial for financial security.`,
      impact: 'negative',
      priority: 'high',
      actionable: true,
      suggestedAction: 'Create a budget to reduce non-essential spending.',
      metrics: { savingsRate: summary.savingsRate, target: 20 },
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Analyze spending patterns
 */
function analyzeSpendingPatterns(summary: UserFinancialSummary): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const spending = summary.monthlySpendingByCategory;

  // Check housing costs (should be under 30% of income)
  const housingPercent = (spending.Housing / summary.totalIncome) * 100;
  if (housingPercent > 30) {
    insights.push({
      id: `housing-${Date.now()}`,
      type: 'budget_alert',
      title: 'High Housing Costs',
      description: `Housing takes up ${housingPercent.toFixed(1)}% of your income, above the recommended 30%.`,
      impact: 'negative',
      priority: 'high',
      actionable: true,
      suggestedAction: 'Consider refinancing or finding more affordable housing options.',
      metrics: { housingPercent, recommended: 30 },
      createdAt: new Date(),
    });
  }

  // Check food spending
  const foodPercent = (spending.Food / summary.totalIncome) * 100;
  if (foodPercent > 15) {
    insights.push({
      id: `food-${Date.now()}`,
      type: 'spending_trend',
      title: 'Elevated Food Spending',
      description: `You're spending ${foodPercent.toFixed(1)}% on food. Meal planning could help reduce this.`,
      impact: 'neutral',
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Try meal prepping to reduce dining out expenses.',
      metrics: { foodPercent, recommended: 10 },
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Analyze investment performance
 */
function analyzeInvestmentPerformance(summary: UserFinancialSummary): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  if (summary.totalInvestments === 0) {
    insights.push({
      id: `invest-start-${Date.now()}`,
      type: 'investment_opportunity',
      title: 'Start Your Investment Journey',
      description: 'You haven\'t made any investments yet. Real estate investments can provide stable passive income.',
      impact: 'neutral',
      priority: 'high',
      actionable: true,
      suggestedAction: 'Explore our investment pools starting from $100.',
      createdAt: new Date(),
    });
    return insights;
  }

  const returnRate = (summary.investmentReturns / summary.totalInvestments) * 100;

  if (returnRate > 0) {
    insights.push({
      id: `invest-perf-${Date.now()}`,
      type: 'portfolio_health',
      title: 'Positive Investment Returns',
      description: `Your investments have returned ${returnRate.toFixed(2)}% so far. Keep up the good work!`,
      impact: 'positive',
      priority: 'low',
      actionable: false,
      metrics: {
        totalInvested: summary.totalInvestments,
        currentValue: summary.portfolioValue,
        returns: summary.investmentReturns,
        returnRate,
      },
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Analyze portfolio health
 */
function analyzePortfolioHealth(summary: UserFinancialSummary): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  if (summary.diversificationScore < 40) {
    insights.push({
      id: `diversify-${Date.now()}`,
      type: 'risk_assessment',
      title: 'Consider Diversifying',
      description: `Your portfolio diversification score is ${summary.diversificationScore}/100. Consider spreading investments across different property types.`,
      impact: 'neutral',
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Explore different property types like multi-family, commercial, or industrial.',
      metrics: { diversificationScore: summary.diversificationScore },
      createdAt: new Date(),
    });
  } else if (summary.diversificationScore >= 80) {
    insights.push({
      id: `diversify-${Date.now()}`,
      type: 'portfolio_health',
      title: 'Well-Diversified Portfolio',
      description: `Your portfolio diversification score is ${summary.diversificationScore}/100. You have good spread across property types.`,
      impact: 'positive',
      priority: 'low',
      actionable: false,
      metrics: { diversificationScore: summary.diversificationScore },
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Identify investment opportunities
 */
function identifyOpportunities(summary: UserFinancialSummary): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // If user has savings but isn't investing much
  const monthlyBudget = summary.totalIncome - summary.totalExpenses;
  if (monthlyBudget > 500 && summary.totalInvestments < monthlyBudget * 6) {
    insights.push({
      id: `opportunity-${Date.now()}`,
      type: 'investment_opportunity',
      title: 'Investment Opportunity',
      description: `You have $${monthlyBudget.toFixed(0)} monthly surplus. Consider increasing your real estate investments.`,
      impact: 'positive',
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Set up automatic monthly investments to build wealth over time.',
      metrics: { monthlySurplus: monthlyBudget },
      createdAt: new Date(),
    });
  }

  return insights;
}

/**
 * Get insights for a specific category
 */
export async function getInsightsByType(
  userId: string,
  type: InsightType
): Promise<FinancialInsight[]> {
  const allInsights = await generateFinancialInsights(userId);
  return allInsights.filter((insight) => insight.type === type);
}

/**
 * Get high priority insights
 */
export async function getHighPriorityInsights(
  userId: string
): Promise<FinancialInsight[]> {
  const allInsights = await generateFinancialInsights(userId);
  return allInsights.filter((insight) => insight.priority === 'high');
}
