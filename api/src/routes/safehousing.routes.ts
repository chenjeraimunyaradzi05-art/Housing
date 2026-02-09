/**
 * Safe Housing Routes - API endpoints for safety verification
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  calculateSafetyScore,
  verifyProperty,
  getSafetyRequirements,
  checkCompliance,
  scheduleInspection,
  reportSafetyConcern,
} from '../lib/safehousing';

const router = Router();

// Get safety score for a property
router.get('/score/:propertyId', authenticate, async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const score = await calculateSafetyScore(propertyId);
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Verify property compliance
router.post('/verify/:propertyId', authenticate, async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const userId = (req as any).user?.id || 'inspector-demo';
    const result = await verifyProperty(propertyId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get regional safety requirements
router.get('/requirements/:region', authenticate, async (req: Request, res: Response) => {
  try {
    const region = req.params.region as string;
    const requirements = getSafetyRequirements(region);
    res.json(requirements);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Check property compliance
router.get('/compliance/:propertyId', authenticate, async (req: Request, res: Response) => {
  try {
    const propertyId = req.params.propertyId as string;
    const region = (req.query.region as string) || 'default';
    const compliance = await checkCompliance(propertyId, region);
    res.json(compliance);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Schedule inspection
router.post('/inspection/schedule', authenticate, async (req: Request, res: Response) => {
  try {
    const { propertyId, inspectionType, requestedDate, contactInfo } = req.body;
    const result = await scheduleInspection(
      propertyId,
      inspectionType,
      new Date(requestedDate),
      contactInfo
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Report safety concern
router.post('/report', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-demo';
    const { propertyId, category, description, severity, photos } = req.body;
    const result = await reportSafetyConcern(propertyId, userId, {
      category,
      description,
      severity,
      photos,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
