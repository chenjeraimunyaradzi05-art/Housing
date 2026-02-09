/**
 * Admin Compliance Routes
 * KYC and AML management for administrators
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import prisma from '../lib/prisma';
import * as kyc from '../lib/kyc';
import * as aml from '../lib/aml';
import { queryAuditLogs, getCriticalEvents } from '../lib/auditLog';

const router = Router();

// Admin authorization middleware
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  next();
};

// ==================== KYC ADMIN ROUTES ====================

/**
 * GET /api/admin/compliance/kyc/pending
 * Get pending KYC verifications
 */
router.get('/kyc/pending', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await kyc.getPendingVerifications(limit, offset);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching pending KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending verifications',
    });
  }
});

/**
 * GET /api/admin/compliance/kyc/:id
 * Get KYC verification details
 */
router.get('/kyc/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const verification = await prisma.kYCVerification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            membershipLevel: true,
          },
        },
      },
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Verification not found',
      });
    }

    res.json({
      success: true,
      data: { verification },
    });
  } catch (error) {
    console.error('Error fetching KYC details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verification details',
    });
  }
});

/**
 * POST /api/admin/compliance/kyc/:id/approve
 * Approve KYC verification
 */
router.post(
  '/kyc/:id/approve',
  authenticate,
  requireAdmin,
  validate(
    z.object({
      notes: z.string().max(1000).optional(),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { notes } = req.body;
      const adminUserId = (req as any).user.id;

      const result = await kyc.approveKYC(req, id, adminUserId, notes);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }

      res.json({
        success: true,
        data: { message: 'KYC verification approved' },
      });
    } catch (error) {
      console.error('Error approving KYC:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve verification',
      });
    }
  }
);

/**
 * POST /api/admin/compliance/kyc/:id/reject
 * Reject KYC verification
 */
router.post(
  '/kyc/:id/reject',
  authenticate,
  requireAdmin,
  validate(
    z.object({
      reason: z.string().min(10, 'Please provide a detailed reason').max(1000),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const adminUserId = (req as any).user.id;

      const result = await kyc.rejectKYC(req, id, adminUserId, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }

      res.json({
        success: true,
        data: { message: 'KYC verification rejected' },
      });
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject verification',
      });
    }
  }
);

// ==================== AML ADMIN ROUTES ====================

/**
 * GET /api/admin/compliance/aml/alerts
 * Get pending AML alerts
 */
router.get('/aml/alerts', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await aml.getPendingAlerts(limit, offset);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching AML alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AML alerts',
    });
  }
});

/**
 * GET /api/admin/compliance/aml/alerts/:id
 * Get AML alert details
 */
router.get('/aml/alerts/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const alert = await prisma.aMLAlert.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            kycStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    // Get related transactions
    const transactions = await aml.getUserTransactionHistory(alert.userId, 90);

    res.json({
      success: true,
      data: { alert, recentTransactions: transactions },
    });
  } catch (error) {
    console.error('Error fetching AML alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert details',
    });
  }
});

/**
 * PATCH /api/admin/compliance/aml/alerts/:id
 * Update AML alert status
 */
router.patch(
  '/aml/alerts/:id',
  authenticate,
  requireAdmin,
  validate(
    z.object({
      status: z.enum(['UNDER_REVIEW', 'CLEARED', 'ESCALATED', 'REPORTED']),
      notes: z.string().max(2000).optional(),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const { status, notes } = req.body;

      await aml.updateAlertStatus(req, id, status, notes);

      res.json({
        success: true,
        data: { message: `Alert status updated to ${status}` },
      });
    } catch (error) {
      console.error('Error updating AML alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update alert',
      });
    }
  }
);

// ==================== AUDIT LOG ROUTES ====================

/**
 * GET /api/admin/compliance/audit-logs
 * Query audit logs
 */
router.get('/audit-logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      category,
      severity,
      startDate,
      endDate,
      limit = '50',
      offset = '0',
    } = req.query;

    const result = await queryAuditLogs({
      userId: userId as string,
      action: action as any,
      category: category as any,
      severity: severity as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: Math.min(parseInt(limit as string), 200),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /api/admin/compliance/audit-logs/critical
 * Get critical security events
 */
router.get('/audit-logs/critical', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await getCriticalEvents(since);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching critical events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch critical events',
    });
  }
});

// ==================== DASHBOARD STATS ====================

/**
 * GET /api/admin/compliance/stats
 * Get compliance dashboard statistics
 */
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      pendingKyc,
      pendingAlerts,
      criticalAlerts,
      recentLogins,
      failedLogins,
    ] = await Promise.all([
      prisma.kYCVerification.count({
        where: { status: { in: ['submitted', 'under_review'] } },
      }),
      prisma.aMLAlert.count({
        where: { status: 'PENDING' },
      }),
      prisma.aMLAlert.count({
        where: { status: 'PENDING', severity: { in: ['HIGH', 'CRITICAL'] } },
      }),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        kyc: {
          pending: pendingKyc,
        },
        aml: {
          pendingAlerts,
          criticalAlerts,
        },
        security: {
          recentLogins,
          failedLogins,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance statistics',
    });
  }
});

export default router;
