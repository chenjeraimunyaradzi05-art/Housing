/**
 * Tax & Accounting Module
 * Tax calculations, K-1 generation, and compliance reporting
 */

export interface TaxProfile {
  userId: string;
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  taxBracket: number;
  state: string;
  hasW2Income: boolean;
  estimatedAnnualIncome: number;
}

export interface InvestmentTaxSummary {
  userId: string;
  taxYear: number;
  totalInvestments: number;
  totalDistributions: number;
  ordinaryIncome: number;
  qualifiedDividends: number;
  shortTermGains: number;
  longTermGains: number;
  depreciationDeductions: number;
  passiveActivityIncome: number;
  stateSpecificDeductions: Record<string, number>;
}

export interface K1Document {
  documentId: string;
  taxYear: number;
  userId: string;
  partnershipName: string;
  partnershipEIN: string;
  partnerType: 'general' | 'limited';
  ordinaryIncome: number;
  rentalIncome: number;
  interestIncome: number;
  dividends: number;
  royalties: number;
  shortTermCapitalGain: number;
  longTermCapitalGain: number;
  section1231Gain: number;
  otherIncome: number;
  selfEmploymentEarnings: number;
  credits: {
    lowIncomeHousingCredit: number;
    rehabCredit: number;
    otherCredits: number;
  };
  foreignTransactions: {
    countryCode: string;
    grossIncome: number;
    taxesPaid: number;
  }[];
  alternativeMinimumTax: {
    adjustments: number;
    preferences: number;
  };
  distributionCodes: string[];
  generatedAt: Date;
}

// Federal tax brackets 2024
const FEDERAL_TAX_BRACKETS: Record<string, { min: number; max: number; rate: number }[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

// State tax rates (simplified)
const STATE_TAX_RATES: Record<string, number> = {
  'California': 0.133,
  'New York': 0.109,
  'Texas': 0,
  'Florida': 0,
  'Washington': 0,
  'Illinois': 0.0495,
  'Pennsylvania': 0.0307,
  'Ohio': 0.0399,
  'Georgia': 0.055,
  'default': 0.05,
};

/**
 * Calculate estimated taxes on investment income
 */
export function calculateInvestmentTax(
  profile: TaxProfile,
  income: {
    ordinaryIncome: number;
    qualifiedDividends: number;
    shortTermGains: number;
    longTermGains: number;
  }
): {
  federalTax: number;
  stateTax: number;
  totalTax: number;
  effectiveRate: number;
  breakdown: Record<string, number>;
} {
  const brackets = FEDERAL_TAX_BRACKETS[profile.filingStatus] || FEDERAL_TAX_BRACKETS.single;

  // Calculate federal tax on ordinary income + short-term gains
  const ordinaryTaxableIncome = income.ordinaryIncome + income.shortTermGains;
  let federalOrdinaryTax = 0;
  let remainingIncome = ordinaryTaxableIncome;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    federalOrdinaryTax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  // Long-term capital gains rates
  let ltcgRate = 0.15; // Default 15%
  if (profile.estimatedAnnualIncome > 500000) {
    ltcgRate = 0.20;
  } else if (profile.estimatedAnnualIncome < 44625) {
    ltcgRate = 0;
  }

  const ltcgTax = income.longTermGains * ltcgRate;

  // Qualified dividends taxed at same rate as LTCG
  const qualifiedDividendTax = income.qualifiedDividends * ltcgRate;

  const federalTax = federalOrdinaryTax + ltcgTax + qualifiedDividendTax;

  // State tax
  const stateRate = STATE_TAX_RATES[profile.state] || STATE_TAX_RATES.default;
  const totalIncome = ordinaryTaxableIncome + income.longTermGains + income.qualifiedDividends;
  const stateTax = totalIncome * stateRate;

  const totalTax = federalTax + stateTax;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;

  return {
    federalTax: Math.round(federalTax * 100) / 100,
    stateTax: Math.round(stateTax * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10000) / 100,
    breakdown: {
      ordinaryIncomeTax: Math.round(federalOrdinaryTax * 100) / 100,
      longTermCapitalGainsTax: Math.round(ltcgTax * 100) / 100,
      qualifiedDividendsTax: Math.round(qualifiedDividendTax * 100) / 100,
      stateTax: Math.round(stateTax * 100) / 100,
    },
  };
}

/**
 * Generate K-1 document for a user
 */
export function generateK1(
  userId: string,
  taxYear: number,
  investments: Array<{
    poolId: string;
    poolName: string;
    ownershipPercent: number;
    totalPoolIncome: number;
    distributions: number;
  }>
): K1Document {
  // Aggregate income from all investments
  let ordinaryIncome = 0;
  let rentalIncome = 0;
  let longTermCapitalGain = 0;

  for (const inv of investments) {
    const share = inv.ownershipPercent / 100;
    // Real estate income is primarily rental income
    rentalIncome += inv.totalPoolIncome * share * 0.8;
    ordinaryIncome += inv.totalPoolIncome * share * 0.15;
    longTermCapitalGain += inv.totalPoolIncome * share * 0.05;
  }

  // Calculate depreciation (significant tax benefit)
  const depreciationDeduction = rentalIncome * 0.3; // 30% of rental income as depreciation

  return {
    documentId: `K1-${taxYear}-${userId}-${Date.now()}`,
    taxYear,
    userId,
    partnershipName: 'VÖR Real Estate Investment LP',
    partnershipEIN: '12-3456789',
    partnerType: 'limited',
    ordinaryIncome: Math.round(ordinaryIncome * 100) / 100,
    rentalIncome: Math.round(rentalIncome * 100) / 100,
    interestIncome: 0,
    dividends: 0,
    royalties: 0,
    shortTermCapitalGain: 0,
    longTermCapitalGain: Math.round(longTermCapitalGain * 100) / 100,
    section1231Gain: 0,
    otherIncome: 0,
    selfEmploymentEarnings: 0,
    credits: {
      lowIncomeHousingCredit: 0,
      rehabCredit: 0,
      otherCredits: 0,
    },
    foreignTransactions: [],
    alternativeMinimumTax: {
      adjustments: 0,
      preferences: 0,
    },
    distributionCodes: ['C'], // Code C = Property distribution
    generatedAt: new Date(),
  };
}

/**
 * Get tax summary for a user's investments
 */
export function getInvestmentTaxSummary(
  userId: string,
  taxYear: number,
  investments: Array<{
    amount: number;
    distributions: number;
    gains: number;
    isLongTerm: boolean;
  }>
): InvestmentTaxSummary {
  let totalInvestments = 0;
  let totalDistributions = 0;
  let shortTermGains = 0;
  let longTermGains = 0;

  for (const inv of investments) {
    totalInvestments += inv.amount;
    totalDistributions += inv.distributions;
    if (inv.isLongTerm) {
      longTermGains += inv.gains;
    } else {
      shortTermGains += inv.gains;
    }
  }

  // Estimated depreciation deduction
  const depreciationDeductions = totalInvestments * 0.027; // ~27.5 year depreciation schedule

  return {
    userId,
    taxYear,
    totalInvestments,
    totalDistributions,
    ordinaryIncome: totalDistributions * 0.1, // 10% as ordinary income
    qualifiedDividends: 0,
    shortTermGains,
    longTermGains,
    depreciationDeductions,
    passiveActivityIncome: totalDistributions * 0.9,
    stateSpecificDeductions: {},
  };
}

/**
 * Calculate quarterly estimated tax payments
 */
export function calculateQuarterlyEstimates(
  annualTaxLiability: number,
  safeHarborPriorYear: number
): {
  q1: { dueDate: string; amount: number };
  q2: { dueDate: string; amount: number };
  q3: { dueDate: string; amount: number };
  q4: { dueDate: string; amount: number };
  totalRequired: number;
  safeHarborAmount: number;
} {
  // Safe harbor: Pay at least 100% of prior year (110% if high income)
  const safeHarborRequired = safeHarborPriorYear;
  const basedOnCurrentYear = annualTaxLiability * 0.9; // 90% of current year

  const quarterlyAmount = Math.max(safeHarborRequired, basedOnCurrentYear) / 4;

  const currentYear = new Date().getFullYear();

  return {
    q1: { dueDate: `April 15, ${currentYear}`, amount: Math.round(quarterlyAmount) },
    q2: { dueDate: `June 15, ${currentYear}`, amount: Math.round(quarterlyAmount) },
    q3: { dueDate: `September 15, ${currentYear}`, amount: Math.round(quarterlyAmount) },
    q4: { dueDate: `January 15, ${currentYear + 1}`, amount: Math.round(quarterlyAmount) },
    totalRequired: Math.round(quarterlyAmount * 4),
    safeHarborAmount: safeHarborRequired,
  };
}

/**
 * Get tax-loss harvesting opportunities
 */
export function getTaxLossHarvestingOpportunities(
  investments: Array<{
    id: string;
    name: string;
    costBasis: number;
    currentValue: number;
    holdingPeriod: number; // days
  }>
): Array<{
  investmentId: string;
  investmentName: string;
  unrealizedLoss: number;
  taxSavings: number;
  recommendation: string;
}> {
  const opportunities = [];

  for (const inv of investments) {
    const unrealizedLoss = inv.costBasis - inv.currentValue;

    if (unrealizedLoss > 0) {
      // Assume 22% marginal tax rate for savings estimate
      const taxSavings = unrealizedLoss * 0.22;

      let recommendation: string;
      if (unrealizedLoss > 1000 && inv.holdingPeriod > 30) {
        recommendation = 'Consider harvesting this loss to offset gains';
      } else if (inv.holdingPeriod < 30) {
        recommendation = 'Wait to avoid wash sale rules';
      } else {
        recommendation = 'Small loss - may not be worth transaction costs';
      }

      opportunities.push({
        investmentId: inv.id,
        investmentName: inv.name,
        unrealizedLoss: Math.round(unrealizedLoss * 100) / 100,
        taxSavings: Math.round(taxSavings * 100) / 100,
        recommendation,
      });
    }
  }

  return opportunities.sort((a, b) => b.taxSavings - a.taxSavings);
}

/**
 * Generate tax report for export
 */
export function generateTaxReport(
  userId: string,
  taxYear: number,
  summary: InvestmentTaxSummary,
  k1Documents: K1Document[]
): {
  reportId: string;
  generatedAt: Date;
  summary: InvestmentTaxSummary;
  documents: string[];
  recommendations: string[];
} {
  const recommendations: string[] = [];

  // Add recommendations based on tax situation
  if (summary.depreciationDeductions > 0) {
    recommendations.push(
      `You have $${summary.depreciationDeductions.toFixed(2)} in depreciation deductions from real estate investments.`
    );
  }

  if (summary.longTermGains > summary.shortTermGains) {
    recommendations.push(
      'Your gains are primarily long-term, qualifying for lower capital gains rates.'
    );
  }

  if (summary.passiveActivityIncome > 25000) {
    recommendations.push(
      'Consider consulting a tax professional about passive activity loss limitations.'
    );
  }

  return {
    reportId: `TAX-${taxYear}-${userId}-${Date.now()}`,
    generatedAt: new Date(),
    summary,
    documents: k1Documents.map((k1) => k1.documentId),
    recommendations,
  };
}
