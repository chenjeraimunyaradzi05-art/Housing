import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { sendSuccess } from '../utils/response';
import {
  mortgageCalculatorSchema,
  affordabilityCalculatorSchema,
  roiCalculatorSchema,
  rentVsBuyCalculatorSchema,
} from '../schemas/calculator.schema';

const router = Router();

// ==================== MORTGAGE CALCULATOR ====================

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
}

router.post(
  '/mortgage',
  validate(mortgageCalculatorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        propertyPrice,
        downPayment,
        loanTerm,
        interestRate,
        propertyTax = 0,
        homeInsurance = 0,
        pmi = 0,
        hoaFees = 0,
      } = req.body;

      const loanAmount = propertyPrice - downPayment;
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;

      // Monthly principal & interest (P&I) using amortization formula
      let monthlyPI: number;
      if (monthlyRate === 0) {
        monthlyPI = loanAmount / numPayments;
      } else {
        monthlyPI =
          (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
      }

      // Monthly escrow amounts
      const monthlyTax = propertyTax / 12;
      const monthlyInsurance = homeInsurance / 12;

      // Calculate PMI if down payment is less than 20%
      const downPaymentPercent = (downPayment / propertyPrice) * 100;
      const monthlyPMI = downPaymentPercent < 20 ? pmi : 0;

      // Total monthly payment
      const totalMonthlyPayment = monthlyPI + monthlyTax + monthlyInsurance + monthlyPMI + hoaFees;

      // Total cost over loan term
      const totalPayments = totalMonthlyPayment * numPayments;
      const totalInterest = monthlyPI * numPayments - loanAmount;

      // Generate amortization schedule (first 12 months + yearly summary)
      const amortizationSchedule: AmortizationRow[] = [];
      let balance = loanAmount;
      let totalInterestPaid = 0;
      let totalPrincipalPaid = 0;

      for (let month = 1; month <= numPayments; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPI - interestPayment;
        balance -= principalPayment;
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;

        // Include first 12 months and every 12th month (yearly)
        if (month <= 12 || month % 12 === 0) {
          amortizationSchedule.push({
            month,
            payment: Math.round(monthlyPI * 100) / 100,
            principal: Math.round(principalPayment * 100) / 100,
            interest: Math.round(interestPayment * 100) / 100,
            balance: Math.max(0, Math.round(balance * 100) / 100),
            totalInterest: Math.round(totalInterestPaid * 100) / 100,
            totalPrincipal: Math.round(totalPrincipalPaid * 100) / 100,
          });
        }
      }

      return sendSuccess(res, {
        inputs: {
          propertyPrice,
          downPayment,
          downPaymentPercent: Math.round(downPaymentPercent * 100) / 100,
          loanAmount,
          loanTerm,
          interestRate,
        },
        monthlyBreakdown: {
          principalAndInterest: Math.round(monthlyPI * 100) / 100,
          propertyTax: Math.round(monthlyTax * 100) / 100,
          homeInsurance: Math.round(monthlyInsurance * 100) / 100,
          pmi: Math.round(monthlyPMI * 100) / 100,
          hoaFees,
          total: Math.round(totalMonthlyPayment * 100) / 100,
        },
        totals: {
          totalPayments: Math.round(totalPayments * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          totalPrincipal: loanAmount,
        },
        amortizationSchedule,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== AFFORDABILITY CALCULATOR ====================

router.post(
  '/affordability',
  validate(affordabilityCalculatorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        annualIncome,
        monthlyDebts,
        downPayment,
        interestRate,
        loanTerm,
        propertyTaxRate,
        insuranceRate,
        maxDtiRatio,
      } = req.body;

      const monthlyIncome = annualIncome / 12;
      const maxMonthlyPayment = (monthlyIncome * maxDtiRatio) / 100 - monthlyDebts;

      if (maxMonthlyPayment <= 0) {
        return sendSuccess(res, {
          maxHomePrice: 0,
          maxLoanAmount: 0,
          message: 'Your current debts exceed the maximum DTI ratio',
        });
      }

      // Iteratively calculate max home price
      // Payment = P&I + Tax + Insurance
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;

      // Start with an estimate and refine
      let maxHomePrice = 0;
      let low = 0;
      let high = maxMonthlyPayment * 12 * loanTerm * 2;

      while (high - low > 100) {
        const mid = (low + high) / 2;
        const loanAmount = mid - downPayment;

        if (loanAmount <= 0) {
          low = mid;
          continue;
        }

        let monthlyPI: number;
        if (monthlyRate === 0) {
          monthlyPI = loanAmount / numPayments;
        } else {
          monthlyPI =
            (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);
        }

        const monthlyTax = (mid * propertyTaxRate) / 100 / 12;
        const monthlyInsurance = (mid * insuranceRate) / 100 / 12;
        const totalPayment = monthlyPI + monthlyTax + monthlyInsurance;

        if (totalPayment <= maxMonthlyPayment) {
          maxHomePrice = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      const maxLoanAmount = maxHomePrice - downPayment;
      const monthlyPI =
        monthlyRate === 0
          ? maxLoanAmount / numPayments
          : (maxLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);

      return sendSuccess(res, {
        inputs: {
          annualIncome,
          monthlyDebts,
          downPayment,
          interestRate,
          loanTerm,
          maxDtiRatio,
        },
        results: {
          maxHomePrice: Math.round(maxHomePrice),
          maxLoanAmount: Math.round(maxLoanAmount),
          estimatedMonthlyPayment: Math.round(monthlyPI * 100) / 100,
          monthlyBudget: Math.round(maxMonthlyPayment * 100) / 100,
          dtiRatio: maxDtiRatio,
        },
        breakdown: {
          grossMonthlyIncome: Math.round(monthlyIncome * 100) / 100,
          maxHousingPayment: Math.round(maxMonthlyPayment * 100) / 100,
          existingDebts: monthlyDebts,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== ROI CALCULATOR ====================

router.post(
  '/roi',
  validate(roiCalculatorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        purchasePrice,
        downPayment,
        closingCosts,
        renovationCosts,
        monthlyRent,
        vacancyRate,
        propertyManagement,
        maintenanceReserve,
        propertyTax,
        insurance,
        hoaFees,
        interestRate,
        loanTerm,
        appreciationRate,
        holdingPeriod,
      } = req.body;

      // Initial investment
      const totalCashInvested = downPayment + closingCosts + renovationCosts;

      // Loan calculations (if financed)
      const loanAmount = purchasePrice - downPayment;
      let monthlyMortgage = 0;
      if (loanAmount > 0 && interestRate && loanTerm) {
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;
        monthlyMortgage =
          (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);
      }

      // Monthly income (accounting for vacancy)
      const effectiveRent = monthlyRent * (1 - vacancyRate / 100);

      // Monthly expenses
      const monthlyManagement = monthlyRent * (propertyManagement / 100);
      const monthlyMaintenance = monthlyRent * (maintenanceReserve / 100);
      const monthlyTax = propertyTax / 12;
      const monthlyInsurance = insurance / 12;

      const totalMonthlyExpenses =
        monthlyMortgage + monthlyManagement + monthlyMaintenance + monthlyTax + monthlyInsurance + hoaFees;

      // Monthly cash flow
      const monthlyCashFlow = effectiveRent - totalMonthlyExpenses;
      const annualCashFlow = monthlyCashFlow * 12;

      // Cash-on-cash return
      const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

      // Cap rate (based on NOI / Purchase Price)
      const annualNOI =
        effectiveRent * 12 -
        (monthlyManagement + monthlyMaintenance + monthlyTax + monthlyInsurance + hoaFees) * 12;
      const capRate = (annualNOI / purchasePrice) * 100;

      // Future value with appreciation
      const futureValue = purchasePrice * Math.pow(1 + appreciationRate / 100, holdingPeriod);
      const totalAppreciation = futureValue - purchasePrice;

      // Total ROI over holding period
      const totalCashFlow = annualCashFlow * holdingPeriod;
      const totalReturn = totalCashFlow + totalAppreciation;
      const totalROI = totalCashInvested > 0 ? (totalReturn / totalCashInvested) * 100 : 0;
      const annualizedROI = Math.pow(1 + totalROI / 100, 1 / holdingPeriod) * 100 - 100;

      return sendSuccess(res, {
        investment: {
          purchasePrice,
          downPayment,
          closingCosts,
          renovationCosts,
          totalCashInvested,
          loanAmount,
        },
        monthlyAnalysis: {
          grossRent: monthlyRent,
          effectiveRent: Math.round(effectiveRent * 100) / 100,
          mortgage: Math.round(monthlyMortgage * 100) / 100,
          management: Math.round(monthlyManagement * 100) / 100,
          maintenance: Math.round(monthlyMaintenance * 100) / 100,
          taxes: Math.round(monthlyTax * 100) / 100,
          insurance: Math.round(monthlyInsurance * 100) / 100,
          hoa: hoaFees,
          totalExpenses: Math.round(totalMonthlyExpenses * 100) / 100,
          cashFlow: Math.round(monthlyCashFlow * 100) / 100,
        },
        annualAnalysis: {
          grossRent: monthlyRent * 12,
          noi: Math.round(annualNOI * 100) / 100,
          cashFlow: Math.round(annualCashFlow * 100) / 100,
        },
        returns: {
          cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
          capRate: Math.round(capRate * 100) / 100,
          totalROI: Math.round(totalROI * 100) / 100,
          annualizedROI: Math.round(annualizedROI * 100) / 100,
        },
        projection: {
          holdingPeriod,
          appreciationRate,
          futureValue: Math.round(futureValue),
          totalAppreciation: Math.round(totalAppreciation),
          totalCashFlow: Math.round(totalCashFlow),
          totalReturn: Math.round(totalReturn),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== RENT VS BUY CALCULATOR ====================

router.post(
  '/rent-vs-buy',
  validate(rentVsBuyCalculatorSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        homePrice,
        downPayment,
        interestRate,
        loanTerm,
        propertyTax,
        insurance,
        maintenance,
        hoaFees,
        homeAppreciation,
        monthlyRent,
        rentIncrease,
        rentersInsurance,
        investmentReturn,
        timeHorizon,
        taxBracket,
      } = req.body;

      const loanAmount = homePrice - downPayment;
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;

      // Monthly mortgage P&I
      const monthlyPI =
        monthlyRate === 0
          ? loanAmount / numPayments
          : (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
            (Math.pow(1 + monthlyRate, numPayments) - 1);

      // Year-by-year comparison
      const yearlyComparison = [];
      let buyingCumulativeCost = downPayment;
      let rentingCumulativeCost = 0;
      let investmentBalance = downPayment; // If renting, invest the down payment
      let currentRent = monthlyRent;
      let homeValue = homePrice;
      let loanBalance = loanAmount;

      for (let year = 1; year <= timeHorizon; year++) {
        // Buying costs for the year
        const yearlyMortgage = monthlyPI * 12;
        const yearlyInterest = loanBalance * (interestRate / 100);
        const yearlyPrincipal = yearlyMortgage - yearlyInterest;
        loanBalance = Math.max(0, loanBalance - yearlyPrincipal);

        const yearlyBuyingCost =
          yearlyMortgage + propertyTax + insurance + maintenance + hoaFees * 12;
        buyingCumulativeCost += yearlyBuyingCost;

        // Tax benefit from mortgage interest deduction
        const taxSavings = yearlyInterest * (taxBracket / 100);
        buyingCumulativeCost -= taxSavings;

        // Home appreciation
        homeValue *= 1 + homeAppreciation / 100;
        const equity = homeValue - loanBalance;

        // Renting costs for the year
        const yearlyRenting = currentRent * 12 + rentersInsurance;
        rentingCumulativeCost += yearlyRenting;

        // Investment growth (difference between buying and renting costs goes to investment)
        const monthlyBuyingCost = yearlyBuyingCost / 12;
        const monthlyRentingCost = currentRent + rentersInsurance / 12;
        const monthlySavings = monthlyBuyingCost - monthlyRentingCost;

        if (monthlySavings > 0) {
          // If buying costs more, renter invests the difference
          for (let month = 0; month < 12; month++) {
            investmentBalance *= 1 + investmentReturn / 100 / 12;
            investmentBalance += monthlySavings;
          }
        } else {
          // If renting costs more, just compound existing investment
          investmentBalance *= 1 + investmentReturn / 100;
        }

        yearlyComparison.push({
          year,
          buying: {
            annualCost: Math.round(yearlyBuyingCost),
            cumulativeCost: Math.round(buyingCumulativeCost),
            homeValue: Math.round(homeValue),
            equity: Math.round(equity),
            loanBalance: Math.round(loanBalance),
          },
          renting: {
            annualCost: Math.round(yearlyRenting),
            cumulativeCost: Math.round(rentingCumulativeCost),
            investmentValue: Math.round(investmentBalance),
          },
        });

        // Rent increases for next year
        currentRent *= 1 + rentIncrease / 100;
      }

      // Final comparison
      const buyingNetWorth = homeValue - loanBalance;
      const rentingNetWorth = investmentBalance;
      const buyingAdvantage = buyingNetWorth - rentingNetWorth;

      return sendSuccess(res, {
        inputs: {
          homePrice,
          downPayment,
          interestRate,
          loanTerm,
          monthlyRent,
          timeHorizon,
        },
        summary: {
          buyingNetWorth: Math.round(buyingNetWorth),
          rentingNetWorth: Math.round(rentingNetWorth),
          advantage: buyingAdvantage > 0 ? 'buying' : 'renting',
          advantageAmount: Math.abs(Math.round(buyingAdvantage)),
          breakEvenYear: yearlyComparison.findIndex(
            (y) => y.buying.equity > y.renting.investmentValue
          ) + 1 || null,
        },
        monthlyComparison: {
          buying: {
            mortgage: Math.round(monthlyPI * 100) / 100,
            taxes: Math.round((propertyTax / 12) * 100) / 100,
            insurance: Math.round((insurance / 12) * 100) / 100,
            maintenance: Math.round((maintenance / 12) * 100) / 100,
            hoa: hoaFees,
            total: Math.round((monthlyPI + propertyTax / 12 + insurance / 12 + maintenance / 12 + hoaFees) * 100) / 100,
          },
          renting: {
            rent: monthlyRent,
            insurance: Math.round((rentersInsurance / 12) * 100) / 100,
            total: Math.round((monthlyRent + rentersInsurance / 12) * 100) / 100,
          },
        },
        yearlyComparison,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
