import { z } from 'zod';

// ==================== MAINTENANCE CATEGORY & STATUS ENUMS ====================

export const maintenanceCategoryEnum = z.enum([
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'APPLIANCE',
  'STRUCTURAL',
  'LANDSCAPING',
  'CLEANING',
  'PEST_CONTROL',
  'ROOFING',
  'FLOORING',
  'PAINTING',
  'SECURITY',
  'OTHER',
]);

export const maintenancePriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const maintenanceStatusEnum = z.enum([
  'PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

// ==================== CREATE MAINTENANCE RECORD ====================

export const createMaintenanceSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid('Invalid property ID'),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional(),
    category: maintenanceCategoryEnum,
    priority: maintenancePriorityEnum.default('MEDIUM'),
    status: maintenanceStatusEnum.default('PENDING'),
    estimatedCost: z.number().min(0, 'Cost cannot be negative').optional(),
    actualCost: z.number().min(0, 'Cost cannot be negative').optional(),
    vendorName: z.string().max(200, 'Vendor name too long').optional(),
    vendorPhone: z.string().max(20, 'Phone number too long').optional(),
    vendorEmail: z.string().email('Invalid email').optional(),
    scheduledDate: z.string().datetime().optional(),
    completedDate: z.string().datetime().optional(),
    notes: z.string().max(2000, 'Notes too long').optional(),
    images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
    recurring: z.boolean().default(false),
    recurringInterval: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional(),
  }),
});

// ==================== UPDATE MAINTENANCE RECORD ====================

export const updateMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid maintenance record ID'),
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().max(2000).optional(),
    category: maintenanceCategoryEnum.optional(),
    priority: maintenancePriorityEnum.optional(),
    status: maintenanceStatusEnum.optional(),
    estimatedCost: z.number().min(0).optional(),
    actualCost: z.number().min(0).optional(),
    vendorName: z.string().max(200).optional(),
    vendorPhone: z.string().max(20).optional(),
    vendorEmail: z.string().email().optional(),
    scheduledDate: z.string().datetime().optional().nullable(),
    completedDate: z.string().datetime().optional().nullable(),
    notes: z.string().max(2000).optional(),
    images: z.array(z.string().url()).max(10).optional(),
    recurring: z.boolean().optional(),
    recurringInterval: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']).optional().nullable(),
  }),
});

// ==================== GET MAINTENANCE BY ID ====================

export const getMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid maintenance record ID'),
  }),
});

// ==================== LIST MAINTENANCE RECORDS ====================

export const listMaintenanceSchema = z.object({
  query: z.object({
    propertyId: z.string().uuid().optional(),
    category: maintenanceCategoryEnum.optional(),
    priority: maintenancePriorityEnum.optional(),
    status: maintenanceStatusEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().transform(Number).pipe(z.number().int().positive()).default(1),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default(20),
    sortBy: z.enum(['createdAt', 'scheduledDate', 'priority', 'status', 'estimatedCost']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// ==================== DELETE MAINTENANCE RECORD ====================

export const deleteMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid maintenance record ID'),
  }),
});

// ==================== MAINTENANCE STATISTICS ====================

export const maintenanceStatsSchema = z.object({
  query: z.object({
    propertyId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(['category', 'status', 'priority', 'month']).default('category'),
  }),
});

// ==================== TYPE EXPORTS ====================

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>['body'];
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>['body'];
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceSchema>['query'];
export type MaintenanceStatsQuery = z.infer<typeof maintenanceStatsSchema>['query'];
export type MaintenanceCategory = z.infer<typeof maintenanceCategoryEnum>;
export type MaintenancePriority = z.infer<typeof maintenancePriorityEnum>;
export type MaintenanceStatus = z.infer<typeof maintenanceStatusEnum>;
