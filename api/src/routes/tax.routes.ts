/**
 * Tax Routes - API endpoints for Tax & Accounting
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  calculateInvestmentTax,
  generateK1,
  getInvestmentTaxSummary,
  calculateQuarterlyEstimates,
  getTaxLossHarvestingOpportunities,
  generateTaxReport,
} from '../lib/tax';

const router = Router();

// Calculate investment taxes
router.post('/calculate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { profile, income } = req.body;
    const result = calculateInvestmentTax({ userId, ...profile }, income);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Generate K-1 document
router.post('/k1/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { taxYear, investments } = req.body;
    const k1 = generateK1(userId, taxYear, investments);
    res.json(k1);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get tax summary
router.get('/summary/:taxYear', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const taxYear = parseInt(req.params.taxYear as string, 10);

    // Mock investments data
    const mockInvestments = [
      { amount: 10000, distributions: 800, gains: 500, isLongTerm: true },
      { amount: 5000, distributions: 400, gains: 200, isLongTerm: true },
    ];

    const summary = getInvestmentTaxSummary(userId, taxYear, mockInvestments);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Calculate quarterly estimates
router.post('/quarterly-estimates', authenticate, async (req: Request, res: Response) => {
  try {
    const { annualTaxLiability, safeHarborPriorYear } = req.body;
    const estimates = calculateQuarterlyEstimates(annualTaxLiability, safeHarborPriorYear);
    res.json(estimates);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get tax-loss harvesting opportunities
router.post('/loss-harvesting', authenticate, async (req: Request, res: Response) => {
  try {
    const { investments } = req.body;
    const opportunities = getTaxLossHarvestingOpportunities(investments);
    res.json({ opportunities });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Generate full tax report
router.get('/report/:taxYear', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const taxYear = parseInt(req.params.taxYear as string, 10);

    // Generate mock data
    const mockInvestments = [
      { amount: 10000, distributions: 800, gains: 500, isLongTerm: true },
    ];
    const summary = getInvestmentTaxSummary(userId, taxYear, mockInvestments);

    const k1 = generateK1(userId, taxYear, [
      {
        poolId: 'pool-1',
        poolName: 'Downtown Mixed-Use Development',
        ownershipPercent: 0.5,
        totalPoolIncome: 50000,
        distributions: 800,
      },
    ]);

    const report = generateTaxReport(userId, taxYear, summary, [k1]);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
