import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { SuccessResponses, ErrorResponses } from '../utils/response';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auditLog, AuditAction } from '../lib/auditLog';

const router = Router();

// Middleware to ensure admin access
const requireAdmin = (req: Request, res: Response, next: () => void) => {
  if (req.user?.role !== 'admin') {
    return ErrorResponses.forbidden(res, 'Admin access required');
  }
  next();
};

/**
 * GET /admin/moderation/reports
 * Get all content reports with filters
 */
router.get('/reports', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined; // 'post' or 'comment'
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const whereClause: Prisma.ContentReportWhereInput = {};

    if (status) {
      whereClause.status = status;
    }

    if (type === 'post') {
      whereClause.postId = { not: null };
      whereClause.commentId = null;
    } else if (type === 'comment') {
      whereClause.commentId = { not: null };
      whereClause.postId = null;
    }

    const reports = await prisma.contentReport.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            authorId: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            authorId: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (reports.length > limit) {
      const nextItem = reports.pop();
      nextCursor = nextItem?.id;
    }

    return SuccessResponses.ok(res, { reports, nextCursor });
  } catch (error) {
    console.error('Get reports error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /admin/moderation/reports/stats
 * Get content report statistics
 */
router.get('/reports/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [pendingCount, reviewedCount, dismissedCount, actionTakenCount, totalReports] = await Promise.all([
      prisma.contentReport.count({ where: { status: 'PENDING' } }),
      prisma.contentReport.count({ where: { status: 'REVIEWED' } }),
      prisma.contentReport.count({ where: { status: 'DISMISSED' } }),
      prisma.contentReport.count({ where: { status: 'ACTION_TAKEN' } }),
      prisma.contentReport.count(),
    ]);

    // Reports by reason
    const byReason = await prisma.contentReport.groupBy({
      by: ['reason'],
      _count: true,
    });

    // Recent reports (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await prisma.contentReport.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return SuccessResponses.ok(res, {
      stats: {
        total: totalReports,
        pending: pendingCount,
        reviewed: reviewedCount,
        dismissed: dismissedCount,
        actionTaken: actionTakenCount,
        recentWeek: recentCount,
        byReason: byReason.map((r) => ({
          reason: r.reason,
          count: r._count,
        })),
      },
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /admin/moderation/reports/:id
 * Get a single report with full details
 */
router.get('/reports/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const reportId = String(req.params.id);

    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                status: true,
              },
            },
          },
        },
        comment: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                status: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!report) {
      return ErrorResponses.notFound(res, 'Report');
    }

    return SuccessResponses.ok(res, { report });
  } catch (error) {
    console.error('Get report error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /admin/moderation/reports/:id/review
 * Review a content report
 */
router.post('/reports/:id/review', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const reportId = String(req.params.id);
    const adminId = req.user?.id;
    if (!adminId) {
      return ErrorResponses.unauthorized(res);
    }

    // Validate input
    const reviewSchema = z.object({
      action: z.enum(['DISMISS', 'WARN_USER', 'DELETE_CONTENT', 'SUSPEND_USER']),
      resolution: z.string().max(2000).optional(),
    });

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return ErrorResponses.badRequest(res, parsed.error.message);
    }

    const { action, resolution } = parsed.data;

    // Validate action
    const validActions = ['DISMISS', 'WARN_USER', 'DELETE_CONTENT', 'SUSPEND_USER'];
    if (!validActions.includes(action)) {
      return ErrorResponses.badRequest(res, `Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    // Load report (outside transaction for data needed to perform actions)
    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        post: true,
        comment: true,
      },
    });

    if (!report) {
      return ErrorResponses.notFound(res, 'Report');
    }

    // Determine new status
    const newStatus = action === 'DISMISS' ? 'DISMISSED' : 'ACTION_TAKEN';

    // Perform action atomically and prevent concurrent reviews by checking status in update
    const txResult = await prisma.$transaction(async (tx) => {
      const updated = await tx.contentReport.updateMany({
        where: { id: reportId, status: 'PENDING' },
        data: {
          status: newStatus,
          reviewedById: adminId,
          reviewedAt: new Date(),
          resolution: `Action: ${action}. ${resolution || ''}`,
        },
      });

      if (updated.count === 0) {
        // Nothing updated -> someone else already reviewed
        return { alreadyReviewed: true };
      }

      // Take action based on decision
      if (action === 'DELETE_CONTENT') {
        if (report.postId) {
          await tx.post.delete({ where: { id: report.postId } });
        } else if (report.commentId) {
          await tx.comment.delete({ where: { id: report.commentId } });
        }
      } else if (action === 'SUSPEND_USER') {
        const authorId = report.post?.authorId || report.comment?.authorId;
        if (authorId) {
          await tx.user.update({
            where: { id: authorId },
            data: { status: 'suspended' },
          });
        }
      }

      // Create notification for content author if action was taken
      if (action !== 'DISMISS') {
        const authorId = report.post?.authorId || report.comment?.authorId;
        if (authorId) {
          await tx.notification.create({
            data: {
              userId: authorId,
              type: 'MODERATION',
              title: 'Content Moderation Notice',
              message: `Your ${report.postId ? 'post' : 'comment'} has been reviewed by our moderation team.`,
              data: JSON.stringify({
                reportId,
                action,
              }),
            },
          });
        }
      }

      return { alreadyReviewed: false };
    });

    if (txResult.alreadyReviewed) {
      return ErrorResponses.badRequest(res, 'This report has already been reviewed');
    }

    // Emit audit log for moderation action (best-effort, non-blocking)
    try {
      let auditAction: AuditAction = 'ADMIN_SETTING_CHANGED';
      if (action === 'DELETE_CONTENT') auditAction = 'DATA_DELETED';
      else if (action === 'SUSPEND_USER') auditAction = 'ADMIN_USER_SUSPENDED';
      else if (action === 'WARN_USER') auditAction = 'ADMIN_USER_UPDATED';

      await auditLog(req, auditAction, {
        resourceType: 'ContentReport',
        resourceId: reportId,
        details: { action, resolution },
      });
    } catch (auditErr) {
      console.error('Failed to emit audit log for moderation action:', auditErr);
    }

    return SuccessResponses.ok(res, {
      message: `Report reviewed successfully. Action: ${action}`,
      status: newStatus,
    });
  } catch (error) {
    console.error('Review report error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /admin/moderation/flagged-users
 * Get users with multiple content reports
 */
router.get('/flagged-users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const minReports = parseInt(req.query.minReports as string) || 3;

    // Find users whose content has been reported multiple times
    const flaggedPosts = await prisma.contentReport.groupBy({
      by: ['postId'],
      where: { postId: { not: null } },
      _count: true,
      having: {
        postId: { _count: { gte: minReports } },
      },
    });

    const flaggedComments = await prisma.contentReport.groupBy({
      by: ['commentId'],
      where: { commentId: { not: null } },
      _count: true,
      having: {
        commentId: { _count: { gte: minReports } },
      },
    });

    // Get post author IDs
    const postIds = flaggedPosts.map((p) => p.postId).filter((id): id is string => id !== null);
    const commentIds = flaggedComments.map((c) => c.commentId).filter((id): id is string => id !== null);

    const [posts, comments] = await Promise.all([
      prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { authorId: true },
      }),
      prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: { authorId: true },
      }),
    ]);

    const authorIds = new Set([
      ...posts.map((p) => p.authorId),
      ...comments.map((c) => c.authorId),
    ]);

    const flaggedUsers = await prisma.user.findMany({
      where: { id: { in: Array.from(authorIds) } },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    return SuccessResponses.ok(res, { flaggedUsers });
  } catch (error) {
    console.error('Get flagged users error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
