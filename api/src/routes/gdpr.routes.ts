/**
 * GDPR Routes
 * Data export, deletion, and consent management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import * as gdpr from '../lib/gdpr';

const router = Router();

/**
 * GET /api/gdpr/export
 * Export all user data (GDPR Article 20 - Data Portability)
 */
router.get('/export', authenticate, authLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await gdpr.exportUserData(req, userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    // Set headers for JSON file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vor-data-export-${new Date().toISOString().split('T')[0]}.json"`
    );

    res.json(result.data);
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data',
    });
  }
});

/**
 * POST /api/gdpr/deletion-request
 * Request account deletion (30-day cooling off period)
 */
router.post(
  '/deletion-request',
  authenticate,
  authLimiter,
  validate(
    z.object({
      reason: z.string().max(500).optional(),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { reason } = req.body;

      const result = await gdpr.requestAccountDeletion(req, userId, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          scheduledDate: result.scheduledDate,
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Account deletion scheduled. You can cancel within 30 days.',
          scheduledDate: result.scheduledDate,
        },
      });
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request account deletion',
      });
    }
  }
);

/**
 * DELETE /api/gdpr/deletion-request
 * Cancel pending account deletion
 */
router.delete('/deletion-request', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await gdpr.cancelAccountDeletion(req, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: { message: 'Account deletion cancelled successfully' },
    });
  } catch (error) {
    console.error('Error cancelling account deletion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel account deletion',
    });
  }
});

/**
 * GET /api/gdpr/consents
 * Get user's consent records
 */
router.get('/consents', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const consents = await gdpr.getUserConsents(userId);

    res.json({
      success: true,
      data: { consents },
    });
  } catch (error) {
    console.error('Error fetching consents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consents',
    });
  }
});

/**
 * POST /api/gdpr/consents
 * Update consent preferences
 */
router.post(
  '/consents',
  authenticate,
  validate(
    z.object({
      consentType: z.enum(['marketing', 'data_processing', 'third_party_sharing', 'analytics']),
      granted: z.boolean(),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { consentType, granted } = req.body;

      await gdpr.recordConsent(userId, consentType, granted);

      res.json({
        success: true,
        data: {
          message: `Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`,
        },
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update consent',
      });
    }
  }
);

export default router;
