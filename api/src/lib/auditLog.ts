/**
 * Audit Logging System
 * Records all significant actions for compliance and security
 */

import prisma from './prisma';
import { Request } from 'express';

export type AuditAction =
  // Authentication
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | '2FA_VERIFIED'
  // Account
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_DELETED'
  | 'EMAIL_VERIFIED'
  | 'PHONE_VERIFIED'
  // KYC/Compliance
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'DOCUMENT_UPLOADED'
  // Financial
  | 'BANK_LINKED'
  | 'BANK_UNLINKED'
  | 'INVESTMENT_CREATED'
  | 'INVESTMENT_CANCELLED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_COMPLETED'
  | 'PAYMENT_PROCESSED'
  // Data Access
  | 'DATA_EXPORTED'
  | 'DATA_DELETED'
  | 'SENSITIVE_DATA_ACCESSED'
  // Admin
  | 'ADMIN_USER_UPDATED'
  | 'ADMIN_USER_SUSPENDED'
  | 'ADMIN_USER_UNSUSPENDED'
  | 'ADMIN_ROLE_CHANGED'
  | 'ADMIN_SETTING_CHANGED';

export type AuditCategory =
  | 'AUTHENTICATION'
  | 'ACCOUNT'
  | 'COMPLIANCE'
  | 'FINANCIAL'
  | 'DATA_ACCESS'
  | 'ADMIN';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Get category for an action
 */
function getCategoryForAction(action: AuditAction): AuditCategory {
  const categoryMap: Record<AuditAction, AuditCategory> = {
    LOGIN: 'AUTHENTICATION',
    LOGIN_FAILED: 'AUTHENTICATION',
    LOGOUT: 'AUTHENTICATION',
    PASSWORD_CHANGE: 'AUTHENTICATION',
    PASSWORD_RESET: 'AUTHENTICATION',
    '2FA_ENABLED': 'AUTHENTICATION',
    '2FA_DISABLED': 'AUTHENTICATION',
    '2FA_VERIFIED': 'AUTHENTICATION',
    ACCOUNT_CREATED: 'ACCOUNT',
    ACCOUNT_UPDATED: 'ACCOUNT',
    ACCOUNT_DELETED: 'ACCOUNT',
    EMAIL_VERIFIED: 'ACCOUNT',
    PHONE_VERIFIED: 'ACCOUNT',
    KYC_SUBMITTED: 'COMPLIANCE',
    KYC_APPROVED: 'COMPLIANCE',
    KYC_REJECTED: 'COMPLIANCE',
    DOCUMENT_UPLOADED: 'COMPLIANCE',
    BANK_LINKED: 'FINANCIAL',
    BANK_UNLINKED: 'FINANCIAL',
    INVESTMENT_CREATED: 'FINANCIAL',
    INVESTMENT_CANCELLED: 'FINANCIAL',
    WITHDRAWAL_REQUESTED: 'FINANCIAL',
    WITHDRAWAL_COMPLETED: 'FINANCIAL',
    PAYMENT_PROCESSED: 'FINANCIAL',
    DATA_EXPORTED: 'DATA_ACCESS',
    DATA_DELETED: 'DATA_ACCESS',
    SENSITIVE_DATA_ACCESSED: 'DATA_ACCESS',
    ADMIN_USER_UPDATED: 'ADMIN',
    ADMIN_USER_SUSPENDED: 'ADMIN',
    ADMIN_USER_UNSUSPENDED: 'ADMIN',
    ADMIN_ROLE_CHANGED: 'ADMIN',
    ADMIN_SETTING_CHANGED: 'ADMIN',
  };
  return categoryMap[action];
}

/**
 * Get severity for an action
 */
function getSeverityForAction(action: AuditAction): AuditSeverity {
  const criticalActions: AuditAction[] = [
    'LOGIN_FAILED',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET',
    '2FA_DISABLED',
    'ACCOUNT_DELETED',
    'KYC_REJECTED',
    'WITHDRAWAL_REQUESTED',
    'DATA_DELETED',
    'ADMIN_USER_SUSPENDED',
    'ADMIN_ROLE_CHANGED',
  ];

  const warningActions: AuditAction[] = [
    'LOGOUT',
    '2FA_ENABLED',
    'KYC_SUBMITTED',
    'BANK_LINKED',
    'BANK_UNLINKED',
    'INVESTMENT_CANCELLED',
    'DATA_EXPORTED',
    'SENSITIVE_DATA_ACCESSED',
    'ADMIN_USER_UPDATED',
  ];

  if (criticalActions.includes(action)) return 'CRITICAL';
  if (warningActions.includes(action)) return 'WARNING';
  return 'INFO';
}

/**
 * Extract client info from request
 */
export function extractClientInfo(req: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';

  const userAgent = req.headers['user-agent'] || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const category = entry.category || getCategoryForAction(entry.action);
    const severity = entry.severity || getSeverityForAction(entry.action);

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        category,
        severity,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        sessionId: entry.sessionId,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break the app
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Create audit log with request context
 */
export async function auditLog(
  req: Request,
  action: AuditAction,
  options: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    severity?: AuditSeverity;
  } = {}
): Promise<void> {
  const { ipAddress, userAgent } = extractClientInfo(req);
  const userId = options.userId || (req as any).user?.id;

  await createAuditLog({
    userId,
    action,
    category: getCategoryForAction(action),
    severity: options.severity || getSeverityForAction(action),
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    details: options.details,
    ipAddress,
    userAgent,
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: AuditLogFilters = {}) {
  const {
    userId,
    action,
    category,
    severity,
    resourceType,
    resourceId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
    hasMore: offset + logs.length < total,
  };
}

/**
 * Get recent audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit: number = 20) {
  return queryAuditLogs({ userId, limit });
}

/**
 * Get critical security events
 */
export async function getCriticalEvents(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
  return queryAuditLogs({
    severity: 'CRITICAL',
    startDate: since,
    limit: 100,
  });
}

/**
 * Get failed login attempts
 */
export async function getFailedLogins(since: Date = new Date(Date.now() - 60 * 60 * 1000)) {
  return queryAuditLogs({
    action: 'LOGIN_FAILED',
    startDate: since,
    limit: 100,
  });
}

/**
 * Clean up old audit logs (for compliance retention policies)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 365): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}
