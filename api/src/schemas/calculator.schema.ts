import { z } from 'zod';

// Mortgage calculator schema
export const mortgageCalculatorSchema = z.object({
  body: z.object({
    propertyPrice: z.number().positive().max(100000000),
    downPayment: z.number().min(0),
    downPaymentPercent: z.number().min(0).max(100).optional(),
    loanTerm: z.number().int().min(1).max(50).default(30), // years
    interestRate: z.number().min(0).max(30), // annual rate as percentage
    propertyTax: z.number().min(0).optional(), // annual
    homeInsurance: z.number().min(0).optional(), // annual
    pmi: z.number().min(0).optional(), // monthly PMI if down payment < 20%
    hoaFees: z.number().min(0).optional(), // monthly
  }),
});

// Affordability calculator schema
export const affordabilityCalculatorSchema = z.object({
  body: z.object({
    annualIncome: z.number().positive(),
    monthlyDebts: z.number().min(0).default(0),
    downPayment: z.number().min(0),
    interestRate: z.number().min(0).max(30),
    loanTerm: z.number().int().min(1).max(50).default(30),
    propertyTaxRate: z.number().min(0).max(10).default(1.2), // annual as % of home value
    insuranceRate: z.number().min(0).max(5).default(0.5), // annual as % of home value
    maxDtiRatio: z.number().min(0).max(100).default(43), // maximum debt-to-income ratio
  }),
});

// Investment ROI calculator schema
export const roiCalculatorSchema = z.object({
  body: z.object({
    purchasePrice: z.number().positive(),
    downPayment: z.number().min(0),
    closingCosts: z.number().min(0).default(0),
    renovationCosts: z.number().min(0).default(0),
    monthlyRent: z.number().positive(),
    vacancyRate: z.number().min(0).max(100).default(5), // percentage
    propertyManagement: z.number().min(0).max(100).default(10), // percentage of rent
    maintenanceReserve: z.number().min(0).max(100).default(5), // percentage of rent
    propertyTax: z.number().min(0), // annual
    insurance: z.number().min(0), // annual
    hoaFees: z.number().min(0).default(0), // monthly
    interestRate: z.number().min(0).max(30).optional(),
    loanTerm: z.number().int().min(1).max(50).optional(),
    appreciationRate: z.number().min(-20).max(50).default(3), // annual appreciation %
    holdingPeriod: z.number().int().min(1).max(50).default(5), // years
  }),
});

// Rent vs Buy calculator schema
export const rentVsBuyCalculatorSchema = z.object({
  body: z.object({
    // Buying scenario
    homePrice: z.number().positive(),
    downPayment: z.number().min(0),
    interestRate: z.number().min(0).max(30),
    loanTerm: z.number().int().min(1).max(50).default(30),
    propertyTax: z.number().min(0), // annual
    insurance: z.number().min(0), // annual
    maintenance: z.number().min(0), // annual
    hoaFees: z.number().min(0).default(0), // monthly
    homeAppreciation: z.number().min(-20).max(50).default(3), // annual %

    // Renting scenario
    monthlyRent: z.number().positive(),
    rentIncrease: z.number().min(0).max(20).default(3), // annual %
    rentersInsurance: z.number().min(0).default(200), // annual

    // Investment assumptions
    investmentReturn: z.number().min(-20).max(50).default(7), // annual % on savings
    timeHorizon: z.number().int().min(1).max(50).default(10), // years
    taxBracket: z.number().min(0).max(50).default(25), // marginal tax rate %
  }),
});

export type MortgageCalculatorInput = z.infer<typeof mortgageCalculatorSchema>['body'];
export type AffordabilityCalculatorInput = z.infer<typeof affordabilityCalculatorSchema>['body'];
export type RoiCalculatorInput = z.infer<typeof roiCalculatorSchema>['body'];
export type RentVsBuyCalculatorInput = z.infer<typeof rentVsBuyCalculatorSchema>['body'];
