import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { SuccessResponses, ErrorResponses } from '../utils/response';

const router = Router();

/**
 * GET /notifications
 * Get all notifications for the current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const unreadOnly = req.query.unreadOnly === 'true';

    const whereClause: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    return SuccessResponses.ok(res, { notifications, nextCursor });
  } catch (error) {
    console.error('Get notifications error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return SuccessResponses.ok(res, { unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /notifications/:id/read
 * Mark a single notification as read
 */
router.post('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const notificationId = String(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return ErrorResponses.notFound(res, 'Notification');
    }

    if (notification.userId !== userId) {
      return ErrorResponses.forbidden(res, 'Not authorized to access this notification');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return SuccessResponses.ok(res, { message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return SuccessResponses.ok(res, { message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }
    const notificationId = String(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return ErrorResponses.notFound(res, 'Notification');
    }

    if (notification.userId !== userId) {
      return ErrorResponses.forbidden(res, 'Not authorized to delete this notification');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return SuccessResponses.ok(res, { message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * DELETE /notifications
 * Clear all notifications
 */
router.delete('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return ErrorResponses.unauthorized(res);
    }

    await prisma.notification.deleteMany({
      where: { userId },
    });

    return SuccessResponses.ok(res, { message: 'All notifications cleared' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
