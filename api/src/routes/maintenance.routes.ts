import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendSuccess, sendPaginated } from '../utils/response';
import { Errors } from '../utils/errors';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  getMaintenanceSchema,
  listMaintenanceSchema,
  deleteMaintenanceSchema,
  maintenanceStatsSchema,
  ListMaintenanceQuery,
  MaintenanceStatsQuery,
} from '../schemas/maintenance.schema';
import type { Prisma } from '@prisma/client';

const router = Router();

// All maintenance routes require authentication
router.use(authenticate);

// ==================== HELPER: Check property ownership ====================

async function checkPropertyAccess(userId: string, propertyId: string) {
  const property = await (prisma as any).property.findFirst({
    where: {
      id: propertyId,
      userId,
    },
    select: { id: true },
  });

  if (!property) {
    throw Errors.forbidden('You do not have access to this property');
  }

  return property;
}

// ==================== CREATE MAINTENANCE RECORD ====================

router.post(
  '/',
  validate(createMaintenanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthorized();
      const data = req.body;

      // Verify property ownership
      await checkPropertyAccess(userId, data.propertyId);

      const maintenance = await (prisma as any).maintenanceRecord.create({
        data: {
          propertyId: data.propertyId,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          estimatedCost: data.estimatedCost,
          actualCost: data.actualCost,
          vendorName: data.vendorName,
          vendorPhone: data.vendorPhone,
          vendorEmail: data.vendorEmail,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          completedDate: data.completedDate ? new Date(data.completedDate) : null,
          notes: data.notes,
          images: data.images || [],
          recurring: data.recurring,
          recurringInterval: data.recurringInterval,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
      });

      return sendSuccess(res, maintenance, 201);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== LIST MAINTENANCE RECORDS ====================

router.get(
  '/',
  validate(listMaintenanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthorized();
      const {
        propertyId,
        category,
        priority,
        status,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query as unknown as ListMaintenanceQuery;

      // Build filter conditions
      const where: Prisma.MaintenanceRecordWhereInput = {
        property: {
          is: {
            ownerId: userId,
          },
        },
      };

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (category) {
        where.category = category;
      }

      if (priority) {
        where.priority = priority;
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.scheduledDate = {};
        if (startDate) {
          where.scheduledDate.gte = new Date(startDate);
        }
        if (endDate) {
          where.scheduledDate.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await (prisma as any).maintenanceRecord.count({ where });

      // Get paginated records
      const records = await (prisma as any).maintenanceRecord.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      return sendPaginated(res, records, total, page, limit);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== GET MAINTENANCE BY ID ====================

router.get(
  '/:id',
  validate(getMaintenanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthorized();
      const { id } = req.params;

      const maintenance = await (prisma as any).maintenanceRecord.findFirst({
        where: {
          id,
          property: {
            userId,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
            },
          },
        },
      });

      if (!maintenance) {
        throw Errors.notFound('Maintenance record');
      }

      return sendSuccess(res, maintenance);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== UPDATE MAINTENANCE RECORD ====================

router.patch(
  '/:id',
  validate(updateMaintenanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthorized();
      const { id } = req.params;
      const data = req.body;

      // Verify record exists and user has access
      const existing = await (prisma as any).maintenanceRecord.findFirst({
        where: {
          id,
          property: {
            userId,
          },
        },
      });

      if (!existing) {
        throw Errors.notFound('Maintenance record');
      }

      // Prepare update data
      const updateData: Prisma.MaintenanceRecordUpdateInput = { ...data };

      // Handle date conversions
      if (data.scheduledDate !== undefined) {
        updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
      }
      if (data.completedDate !== undefined) {
        updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
      }

      // Auto-set completedDate when status changes to COMPLETED
      if (data.status === 'COMPLETED' && !existing.completedDate && !data.completedDate) {
        updateData.completedDate = new Date();
      }

      const maintenance = await (prisma as any).maintenanceRecord.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
        },
      });

      return sendSuccess(res, maintenance);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== DELETE MAINTENANCE RECORD ====================

router.delete(
  '/:id',
  validate(deleteMaintenanceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthorized();
      const { id } = req.params;

      // Verify record exists and user has access
      const existing = await (prisma as any).maintenanceRecord.findFirst({
        where: {
          id,
          property: {
            userId,
          },
        },
      });

      if (!existing) {
        throw Errors.notFound('Maintenance record');
      }

      await (prisma as any).maintenanceRecord.delete({
        where: { id },
      });

      return sendSuccess(res, { message: 'Maintenance record deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== MAINTENANCE STATISTICS ====================

router.get(
  '/stats/summary',
  validate(maintenanceStatsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthorized();
      const { propertyId, startDate, endDate } = req.query as unknown as MaintenanceStatsQuery;

      // Base where clause
      const where: Prisma.MaintenanceRecordWhereInput = {
        property: {
          is: {
            ownerId: userId,
          },
        },
      };

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get total counts by status
      const statusCounts = await (prisma as any).maintenanceRecord.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      });

      // Get total costs
      const costStats = await (prisma as any).maintenanceRecord.aggregate({
        where,
        _sum: {
          estimatedCost: true,
          actualCost: true,
        },
        _avg: {
          estimatedCost: true,
          actualCost: true,
        },
        _count: { id: true },
      });

      // Get counts by category
      const categoryCounts = await (prisma as any).maintenanceRecord.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
        _sum: { actualCost: true },
      });

      // Get priority distribution
      const priorityCounts = await (prisma as any).maintenanceRecord.groupBy({
        by: ['priority'],
        where,
        _count: { id: true },
      });

      // Get upcoming scheduled maintenance
      const upcoming = await (prisma as any).maintenanceRecord.findMany({
        where: {
          ...where,
          status: { in: ['PENDING', 'SCHEDULED'] },
          scheduledDate: {
            gte: new Date(),
          },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          priority: true,
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Get overdue maintenance
      const overdue = await (prisma as any).maintenanceRecord.findMany({
        where: {
          ...where,
          status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] },
          scheduledDate: {
            lt: new Date(),
          },
        },
        orderBy: { scheduledDate: 'asc' },
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          priority: true,
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return sendSuccess(res, {
        overview: {
          totalRecords: costStats._count.id,
          totalEstimatedCost: costStats._sum.estimatedCost || 0,
          totalActualCost: costStats._sum.actualCost || 0,
          avgEstimatedCost: Math.round((costStats._avg.estimatedCost || 0) * 100) / 100,
          avgActualCost: Math.round((costStats._avg.actualCost || 0) * 100) / 100,
        },
        byStatus: statusCounts.map((s: { status: string; _count: { id: number } }) => ({
          status: s.status,
          count: s._count.id,
        })),
        byCategory: categoryCounts.map((c: { category: string; _count: { id: number }; _sum: { actualCost: number | null } }) => ({
          category: c.category,
          count: c._count.id,
          totalCost: c._sum.actualCost || 0,
        })),
        byPriority: priorityCounts.map((p: { priority: string; _count: { id: number } }) => ({
          priority: p.priority,
          count: p._count.id,
        })),
        upcoming,
        overdue,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
