/**
 * AI Index - Barrel export for AI/ML modules
 */

// Property Valuation (AVM)
export {
  calculatePropertyValuation,
  valuatePropertyById,
  type PropertyFeatures,
  type ValuationResult,
  type ComparableProperty,
} from './propertyValuation';

// Investment Recommendations
export {
  generateRecommendations,
  getSimilarInvestments,
  type UserInvestmentProfile,
  type InvestmentRecommendation,
} from './recommendations';

// Expense Categorization
export {
  categorizeTransaction,
  categorizeTransactions,
  learnFromCorrection,
  suggestCategories,
  getAllCategories,
  type CategorizedTransaction,
} from './expenseCategorization';

// Financial Insights
export {
  generateFinancialInsights,
  getInsightsByType,
  getHighPriorityInsights,
  type FinancialInsight,
  type InsightType,
  type UserFinancialSummary,
} from './financialInsights';

// Market Analysis
export {
  analyzeMarket,
  getComparativeAnalysis,
  getAllRegionalData,
  getMarketHealthScore,
  getInvestmentTiming,
  type MarketTrend,
  type MarketForecast,
  type RegionalMarketData,
  type TrendDirection,
} from './marketAnalysis';

// Anomaly Detection
export {
  detectAnomalies,
  buildSpendingProfile,
  getAnomalySummary,
  type Transaction,
  type Anomaly,
  type AnomalyType,
  type UserSpendingProfile,
} from './anomalyDetection';
