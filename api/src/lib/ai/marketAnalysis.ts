/**
 * Market Trend Analysis
 * Analyzes real estate market trends and provides forecasts
 */

export interface MarketTrend {
  region: string;
  propertyType: string;
  period: string;
  priceChange: number;
  volumeChange: number;
  daysOnMarket: number;
  inventoryLevel: 'low' | 'balanced' | 'high';
  forecast: MarketForecast;
}

export interface MarketForecast {
  shortTerm: TrendDirection; // 3 months
  mediumTerm: TrendDirection; // 6 months
  longTerm: TrendDirection; // 12 months
  confidence: number;
  factors: string[];
}

export type TrendDirection = 'strong_growth' | 'growth' | 'stable' | 'decline' | 'strong_decline';

export interface RegionalMarketData {
  region: string;
  averagePrice: number;
  medianPrice: number;
  pricePerSqFt: number;
  avgDaysOnMarket: number;
  listToSaleRatio: number;
  inventoryMonths: number;
  yearOverYearChange: number;
  quarterOverQuarterChange: number;
}

// Regional market baseline data (would be updated from real data sources)
const REGIONAL_DATA: Record<string, RegionalMarketData> = {
  'New York': {
    region: 'New York',
    averagePrice: 850000,
    medianPrice: 720000,
    pricePerSqFt: 550,
    avgDaysOnMarket: 45,
    listToSaleRatio: 0.98,
    inventoryMonths: 3.2,
    yearOverYearChange: 4.5,
    quarterOverQuarterChange: 1.2,
  },
  'Los Angeles': {
    region: 'Los Angeles',
    averagePrice: 920000,
    medianPrice: 780000,
    pricePerSqFt: 620,
    avgDaysOnMarket: 38,
    listToSaleRatio: 0.99,
    inventoryMonths: 2.8,
    yearOverYearChange: 5.8,
    quarterOverQuarterChange: 1.5,
  },
  'Chicago': {
    region: 'Chicago',
    averagePrice: 380000,
    medianPrice: 320000,
    pricePerSqFt: 220,
    avgDaysOnMarket: 52,
    listToSaleRatio: 0.96,
    inventoryMonths: 4.1,
    yearOverYearChange: 3.2,
    quarterOverQuarterChange: 0.8,
  },
  'Miami': {
    region: 'Miami',
    averagePrice: 580000,
    medianPrice: 490000,
    pricePerSqFt: 380,
    avgDaysOnMarket: 42,
    listToSaleRatio: 0.97,
    inventoryMonths: 3.5,
    yearOverYearChange: 7.2,
    quarterOverQuarterChange: 2.1,
  },
  'Dallas': {
    region: 'Dallas',
    averagePrice: 420000,
    medianPrice: 360000,
    pricePerSqFt: 190,
    avgDaysOnMarket: 35,
    listToSaleRatio: 0.98,
    inventoryMonths: 2.9,
    yearOverYearChange: 6.5,
    quarterOverQuarterChange: 1.8,
  },
  'Seattle': {
    region: 'Seattle',
    averagePrice: 780000,
    medianPrice: 680000,
    pricePerSqFt: 480,
    avgDaysOnMarket: 28,
    listToSaleRatio: 1.02,
    inventoryMonths: 2.1,
    yearOverYearChange: 4.8,
    quarterOverQuarterChange: 1.3,
  },
  'Denver': {
    region: 'Denver',
    averagePrice: 550000,
    medianPrice: 480000,
    pricePerSqFt: 310,
    avgDaysOnMarket: 32,
    listToSaleRatio: 0.99,
    inventoryMonths: 2.5,
    yearOverYearChange: 5.2,
    quarterOverQuarterChange: 1.4,
  },
  'Atlanta': {
    region: 'Atlanta',
    averagePrice: 380000,
    medianPrice: 320000,
    pricePerSqFt: 180,
    avgDaysOnMarket: 40,
    listToSaleRatio: 0.97,
    inventoryMonths: 3.3,
    yearOverYearChange: 6.8,
    quarterOverQuarterChange: 1.9,
  },
};

/**
 * Get market analysis for a specific region
 */
export function analyzeMarket(region: string, propertyType?: string): MarketTrend {
  const data = REGIONAL_DATA[region] || REGIONAL_DATA['Chicago']; // Default to Chicago

  // Determine inventory level
  let inventoryLevel: 'low' | 'balanced' | 'high';
  if (data.inventoryMonths < 3) {
    inventoryLevel = 'low';
  } else if (data.inventoryMonths > 5) {
    inventoryLevel = 'high';
  } else {
    inventoryLevel = 'balanced';
  }

  // Generate forecast based on current metrics
  const forecast = generateForecast(data);

  return {
    region: data.region,
    propertyType: propertyType || 'all',
    period: 'current',
    priceChange: data.yearOverYearChange,
    volumeChange: calculateVolumeChange(data),
    daysOnMarket: data.avgDaysOnMarket,
    inventoryLevel,
    forecast,
  };
}

/**
 * Generate market forecast
 */
function generateForecast(data: RegionalMarketData): MarketForecast {
  const factors: string[] = [];
  let score = 0;

  // Factor 1: Year-over-year change momentum
  if (data.yearOverYearChange > 5) {
    score += 2;
    factors.push('Strong price appreciation momentum');
  } else if (data.yearOverYearChange > 2) {
    score += 1;
    factors.push('Moderate price growth');
  } else if (data.yearOverYearChange < 0) {
    score -= 2;
    factors.push('Price decline trend');
  }

  // Factor 2: Inventory levels
  if (data.inventoryMonths < 3) {
    score += 2;
    factors.push('Low inventory driving competition');
  } else if (data.inventoryMonths > 5) {
    score -= 1;
    factors.push('High inventory may pressure prices');
  }

  // Factor 3: Days on market
  if (data.avgDaysOnMarket < 30) {
    score += 1;
    factors.push('Fast-moving market');
  } else if (data.avgDaysOnMarket > 60) {
    score -= 1;
    factors.push('Slower market activity');
  }

  // Factor 4: List-to-sale ratio
  if (data.listToSaleRatio >= 1) {
    score += 1;
    factors.push('Properties selling above asking price');
  } else if (data.listToSaleRatio < 0.95) {
    score -= 1;
    factors.push('Price negotiations favor buyers');
  }

  // Convert score to trend direction
  const getTrend = (s: number): TrendDirection => {
    if (s >= 4) return 'strong_growth';
    if (s >= 2) return 'growth';
    if (s >= -1) return 'stable';
    if (s >= -3) return 'decline';
    return 'strong_decline';
  };

  // Forecast typically moderates over time
  return {
    shortTerm: getTrend(score),
    mediumTerm: getTrend(Math.round(score * 0.8)),
    longTerm: getTrend(Math.round(score * 0.6)),
    confidence: Math.min(85, 60 + Math.abs(score) * 5),
    factors,
  };
}

/**
 * Calculate volume change based on market data
 */
function calculateVolumeChange(data: RegionalMarketData): number {
  // Estimate volume change from inventory and days on market
  if (data.inventoryMonths < 3 && data.avgDaysOnMarket < 40) {
    return 5 + Math.random() * 10; // High activity
  } else if (data.inventoryMonths > 5) {
    return -5 - Math.random() * 5; // Low activity
  }
  return -2 + Math.random() * 8; // Moderate
}

/**
 * Get comparative market analysis
 */
export function getComparativeAnalysis(regions: string[]): MarketTrend[] {
  return regions.map((region) => analyzeMarket(region));
}

/**
 * Get all available regional data
 */
export function getAllRegionalData(): RegionalMarketData[] {
  return Object.values(REGIONAL_DATA);
}

/**
 * Get market health score for a region
 */
export function getMarketHealthScore(region: string): {
  score: number;
  rating: string;
  components: Record<string, number>;
} {
  const data = REGIONAL_DATA[region];
  if (!data) {
    return {
      score: 50,
      rating: 'Unknown',
      components: {},
    };
  }

  const components: Record<string, number> = {
    priceGrowth: Math.min(100, Math.max(0, 50 + data.yearOverYearChange * 5)),
    inventoryHealth: Math.min(100, Math.max(0, 100 - Math.abs(data.inventoryMonths - 4) * 15)),
    marketSpeed: Math.min(100, Math.max(0, 100 - data.avgDaysOnMarket)),
    buyerDemand: Math.min(100, data.listToSaleRatio * 100),
  };

  const score = Math.round(
    (components.priceGrowth * 0.3 +
      components.inventoryHealth * 0.25 +
      components.marketSpeed * 0.25 +
      components.buyerDemand * 0.2)
  );

  let rating: string;
  if (score >= 80) rating = 'Excellent';
  else if (score >= 65) rating = 'Good';
  else if (score >= 50) rating = 'Fair';
  else if (score >= 35) rating = 'Challenging';
  else rating = 'Poor';

  return { score, rating, components };
}

/**
 * Get investment timing recommendation
 */
export function getInvestmentTiming(region: string): {
  recommendation: 'buy' | 'hold' | 'wait';
  reasons: string[];
  confidence: number;
} {
  const trend = analyzeMarket(region);
  const health = getMarketHealthScore(region);
  const reasons: string[] = [];

  let buyScore = 0;

  // Analyze forecast
  if (trend.forecast.shortTerm === 'growth' || trend.forecast.shortTerm === 'strong_growth') {
    buyScore += 2;
    reasons.push('Positive short-term outlook');
  }

  // Analyze current conditions
  if (trend.inventoryLevel === 'high') {
    buyScore += 1;
    reasons.push('Higher inventory means more negotiating power');
  } else if (trend.inventoryLevel === 'low') {
    buyScore -= 1;
    reasons.push('Low inventory may limit options');
  }

  // Market health
  if (health.score >= 65) {
    buyScore += 1;
    reasons.push('Strong overall market health');
  }

  let recommendation: 'buy' | 'hold' | 'wait';
  if (buyScore >= 2) {
    recommendation = 'buy';
  } else if (buyScore >= 0) {
    recommendation = 'hold';
  } else {
    recommendation = 'wait';
    reasons.push('Consider waiting for better conditions');
  }

  return {
    recommendation,
    reasons,
    confidence: Math.min(80, 50 + Math.abs(buyScore) * 10),
  };
}
