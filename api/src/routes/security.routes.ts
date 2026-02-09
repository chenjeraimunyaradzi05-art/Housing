/**
 * Security Routes
 * 2FA management and security settings
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { auditLog } from '../lib/auditLog';
import * as twoFactor from '../lib/twoFactor';

const router = Router();

// ==================== 2FA ROUTES ====================

/**
 * GET /api/security/2fa/status
 * Check if 2FA is enabled for the current user
 */
router.get('/2fa/status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const enabled = await twoFactor.has2FAEnabled(userId);

    res.json({
      success: true,
      data: { twoFactorEnabled: enabled },
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check 2FA status',
    });
  }
});

/**
 * POST /api/security/2fa/setup
 * Generate 2FA secret and QR code for setup
 */
router.post('/2fa/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;

    // Check if already enabled
    const alreadyEnabled = await twoFactor.has2FAEnabled(userId);
    if (alreadyEnabled) {
      return res.status(400).json({
        success: false,
        error: '2FA is already enabled. Disable it first to set up again.',
      });
    }

    const setup = await twoFactor.setup2FA(userId, userEmail);

    res.json({
      success: true,
      data: {
        qrCode: setup.qrCodeDataUrl,
        manualEntryKey: setup.manualEntryKey,
        message: 'Scan the QR code with your authenticator app, then verify with a code',
      },
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set up 2FA',
    });
  }
});

const verifySchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

/**
 * POST /api/security/2fa/enable
 * Verify token and enable 2FA
 */
router.post(
  '/2fa/enable',
  authenticate,
  authLimiter,
  validate(verifySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { token } = req.body;

      const result = await twoFactor.enable2FA(userId, token);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      // Generate backup codes
      const backupCodes = twoFactor.generateBackupCodes();

      await auditLog(req, '2FA_ENABLED', { userId });

      res.json({
        success: true,
        data: {
          message: '2FA has been enabled successfully',
          backupCodes,
          warning: 'Save these backup codes in a safe place. They can be used to access your account if you lose your authenticator.',
        },
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enable 2FA',
      });
    }
  }
);

/**
 * POST /api/security/2fa/disable
 * Disable 2FA (requires current token)
 */
router.post(
  '/2fa/disable',
  authenticate,
  authLimiter,
  validate(verifySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { token } = req.body;

      const result = await twoFactor.disable2FA(userId, token);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      await auditLog(req, '2FA_DISABLED', { userId });

      res.json({
        success: true,
        data: { message: '2FA has been disabled successfully' },
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disable 2FA',
      });
    }
  }
);

/**
 * POST /api/security/2fa/verify
 * Verify 2FA token (for login flow)
 */
router.post(
  '/2fa/verify',
  authLimiter,
  validate(
    z.object({
      userId: z.string(),
      token: z.string().length(6),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const { userId, token } = req.body;

      const result = await twoFactor.verify2FALogin(userId, token);

      if (!result.success) {
        await auditLog(req, 'LOGIN_FAILED', {
          userId,
          details: { reason: '2FA verification failed' },
        });

        return res.status(401).json({
          success: false,
          error: result.error,
        });
      }

      await auditLog(req, '2FA_VERIFIED', { userId });

      res.json({
        success: true,
        data: { verified: true },
      });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify 2FA',
      });
    }
  }
);

// ==================== SECURITY AUDIT ROUTES ====================

/**
 * GET /api/security/audit-log
 * Get user's security audit log
 */
router.get('/audit-log', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const { getUserAuditLogs } = await import('../lib/auditLog');
    const result = await getUserAuditLogs(userId, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
    });
  }
});

/**
 * GET /api/security/sessions
 * Get active sessions (placeholder - would need session management)
 */
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // For now, return current session info
    res.json({
      success: true,
      data: {
        sessions: [
          {
            id: 'current',
            current: true,
            device: req.headers['user-agent'] || 'Unknown',
            ipAddress:
              (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
              req.socket.remoteAddress,
            lastActive: new Date().toISOString(),
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
});

export default router;
