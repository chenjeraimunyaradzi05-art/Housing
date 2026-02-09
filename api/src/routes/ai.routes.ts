/**
 * AI Routes - API endpoints for AI/ML features
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import {
  calculatePropertyValuation,
  valuatePropertyById,
  generateRecommendations,
  categorizeTransaction,
  categorizeTransactions,
  getAllCategories,
  generateFinancialInsights,
  getHighPriorityInsights,
  analyzeMarket,
  getComparativeAnalysis,
  getAllRegionalData,
  getMarketHealthScore,
  getInvestmentTiming,
  detectAnomalies,
  buildSpendingProfile,
  getAnomalySummary,
} from '../lib/ai';

const router = Router();

// Property Valuation Endpoints
const valuationSchema = z.object({
  beds: z.number().nonnegative().optional(),
  baths: z.number().nonnegative().optional(),
  sqft: z.number().nonnegative().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  zipcode: z.string().optional(),
  yearBuilt: z.number().optional(),
  propertyType: z.string().optional(),
});

router.post('/valuation', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = valuationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const features = parsed.data;
    const result = calculatePropertyValuation(features as any);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/valuation/property/:propertyId', authenticate, async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const result = await valuatePropertyById(propertyId);

    if (!result) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Recommendation Endpoints
router.get('/recommendations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const recommendations = await generateRecommendations(userId, limit);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Expense Categorization Endpoints
const categorizeSchema = z.object({
  description: z.string().min(1),
});

router.post('/categorize', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = categorizeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const { description } = parsed.data;
    const result = categorizeTransaction(description);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

const categorizeBatchSchema = z.object({
  descriptions: z.array(z.string().min(1)),
});

router.post('/categorize/batch', authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = categorizeBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const { descriptions } = parsed.data;
    const results = categorizeTransactions(descriptions);
    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/categories', authenticate, async (req: Request, res: Response) => {
  try {
    const categories = getAllCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Financial Insights Endpoints
router.get('/insights', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const insights = await generateFinancialInsights(userId);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/insights/priority', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const insights = await getHighPriorityInsights(userId);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Market Analysis Endpoints
router.get('/market', authenticate, async (req: Request, res: Response) => {
  try {
    const regionalData = getAllRegionalData();
    res.json({ regions: regionalData });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/market/:region', authenticate, async (req: Request, res: Response) => {
  try {
    const region = req.params.region as string;
    const propertyType = req.query.propertyType as string | undefined;

    const analysis = analyzeMarket(region, propertyType);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/market/compare', authenticate, async (req: Request, res: Response) => {
  try {
    const { regions } = req.body;
    const analysis = getComparativeAnalysis(regions);
    res.json({ analysis });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get('/market/:region/health', authenticate, async (req: Request, res: Response) => {
  try {
    const region = req.params.region as string;
    const health = getMarketHealthScore(region);
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/market/:region/timing', authenticate, async (req: Request, res: Response) => {
  try {
    const region = req.params.region as string;
    const timing = getInvestmentTiming(region);
    res.json(timing);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Anomaly Detection Endpoints
router.post('/anomalies/detect', authenticate, async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    const parsedTransactions = transactions.map((t: any) => ({
      ...t,
      timestamp: new Date(t.timestamp),
    }));
    const profile = buildSpendingProfile(parsedTransactions);
    const anomalies = detectAnomalies(parsedTransactions, profile);
    const summary = getAnomalySummary(anomalies);

    res.json({
      anomalies,
      summary,
      profile: {
        avgTransactionAmount: profile.avgTransactionAmount,
        avgDailyTransactions: profile.avgDailyTransactions,
      },
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
