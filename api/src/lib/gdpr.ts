/**
 * GDPR Compliance Utilities
 * Data export, deletion, and consent management
 */

import prisma from './prisma';
import { auditLog } from './auditLog';
import { Request } from 'express';
import { createHash } from 'crypto';

interface DataExportResult {
  success: boolean;
  data?: UserDataExport;
  error?: string;
}

interface UserDataExport {
  exportDate: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    bio: string | null;
    location: string | null;
    country: string | null;
    membershipLevel: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
  profile: {
    dateOfBirth: string | null;
    identityVerified: boolean;
    kycStatus: string;
    twoFactorEnabled: boolean;
  };
  financialData: {
    linkedAccounts: Array<{
      id: string;
      name: string;
      type: string;
      institutionName: string | null;
      linkedAt: string;
    }>;
    investments: Array<{
      id: string;
      poolName: string;
      amount: string;
      status: string;
      createdAt: string;
    }>;
    transactions: Array<{
      id: string;
      amount: string;
      type: string;
      date: string;
      category: string | null;
    }>;
  };
  socialData: {
    posts: Array<{
      id: string;
      content: string;
      createdAt: string;
      likesCount: number;
      commentsCount: number;
    }>;
    comments: Array<{
      id: string;
      content: string;
      createdAt: string;
    }>;
    followers: number;
    following: number;
    groupMemberships: Array<{
      groupName: string;
      role: string;
      joinedAt: string;
    }>;
  };
  communicationData: {
    conversationsCount: number;
    notificationsCount: number;
  };
  auditLog: Array<{
    action: string;
    category: string;
    createdAt: string;
    ipAddress: string | null;
  }>;
  consentRecords: Array<{
    type: string;
    granted: boolean;
    grantedAt: string;
    revokedAt: string | null;
  }>;
}

/**
 * Export all user data for GDPR compliance
 */
export async function exportUserData(req: Request, userId: string): Promise<DataExportResult> {
  try {
    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        investments: {
          include: {
            pool: { select: { name: true } },
          },
        },
        posts: {
          include: {
            _count: { select: { likes: true, comments: true } },
          },
        },
        comments: true,
        followedBy: true,
        following: true,
        groupMemberships: {
          include: { group: { select: { name: true } } },
        },
        conversations: true,
        notifications: { take: 100, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch linked accounts
    const accounts = await prisma.userAccount.findMany({
      where: { userId },
    });

    // Get account IDs for transaction query
    const accountIds = accounts.map(a => a.id);

    // Fetch transactions (limited)
    const transactions = accountIds.length > 0
      ? await prisma.transaction.findMany({
          where: { accountId: { in: accountIds } },
          take: 1000,
          orderBy: { date: 'desc' },
        })
      : [];

    // Fetch audit logs (limited)
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch consent records
    const consents = await prisma.userConsent.findMany({
      where: { userId },
    });

    // Build export object
    const dataExport: UserDataExport = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        country: user.country,
        membershipLevel: user.membershipLevel,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      profile: {
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        identityVerified: user.identityVerified,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      financialData: {
        linkedAccounts: accounts.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          institutionName: a.institutionName,
          linkedAt: a.createdAt.toISOString(),
        })),
        investments: user.investments.map(i => ({
          id: i.id,
          poolName: i.pool.name,
          amount: i.amountInvested.toString(),
          status: i.status,
          createdAt: i.createdAt.toISOString(),
        })),
        transactions: transactions.map(t => ({
          id: t.id,
          amount: t.amount.toString(),
          type: t.paymentChannel || 'unknown',
          date: t.date.toISOString(),
          category: t.category,
        })),
      },
      socialData: {
        posts: user.posts.map(p => ({
          id: p.id,
          content: p.content || '',
          createdAt: p.createdAt.toISOString(),
          likesCount: p._count.likes,
          commentsCount: p._count.comments,
        })),
        comments: user.comments.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        })),
        followers: user.followedBy.length,
        following: user.following.length,
        groupMemberships: user.groupMemberships.map(gm => ({
          groupName: gm.group.name,
          role: gm.role,
          joinedAt: gm.joinedAt.toISOString(),
        })),
      },
      communicationData: {
        conversationsCount: user.conversations.length,
        notificationsCount: user.notifications.length,
      },
      auditLog: auditLogs.map(l => ({
        action: l.action,
        category: l.category,
        createdAt: l.createdAt.toISOString(),
        ipAddress: l.ipAddress,
      })),
      consentRecords: consents.map(c => ({
        type: c.consentType,
        granted: c.granted,
        grantedAt: c.grantedAt.toISOString(),
        revokedAt: c.revokedAt?.toISOString() || null,
      })),
    };

    // Audit the export
    await auditLog(req, 'DATA_EXPORTED', {
      userId,
      details: {
        exportSize: JSON.stringify(dataExport).length,
        recordCounts: {
          accounts: accounts.length,
          transactions: transactions.length,
          posts: user.posts.length,
          auditLogs: auditLogs.length,
        },
      },
    });

    return { success: true, data: dataExport };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error: 'Failed to export user data' };
  }
}

/**
 * Delete user account (soft delete with data anonymization)
 */
export async function deleteUserAccount(
  req: Request,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.status === 'deleted') {
      return { success: false, error: 'Account is already deleted' };
    }

    // Generate anonymized identifiers
    const anonymizedEmail = `deleted_${createHash('sha256').update(user.email).digest('hex').substring(0, 12)}@deleted.vor.io`;
    const anonymizedUsername = `deleted_${createHash('sha256').update(user.username).digest('hex').substring(0, 12)}`;

    // Soft delete and anonymize user data
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'deleted',
        email: anonymizedEmail,
        username: anonymizedUsername,
        firstName: 'Deleted',
        lastName: 'User',
        phone: null,
        bio: null,
        location: null,
        country: null,
        avatar: null,
        profileImage: null,
        dateOfBirth: null,
        passwordHash: 'DELETED',
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    // Delete sensitive related data
    await prisma.$transaction([
      // Delete refresh tokens
      prisma.refreshToken.deleteMany({ where: { userId } }),

      // Delete verification tokens
      prisma.verificationToken.deleteMany({ where: { email: user.email } }),

      // Delete linked bank accounts (unlink via Plaid)
      prisma.userAccount.deleteMany({ where: { userId } }),

      // Delete push notification tokens
      prisma.pushToken.deleteMany({ where: { userId } }),
    ]);

    // Archive deletion request
    await prisma.accountDeletionRequest.create({
      data: {
        userId,
        reason,
        requestedAt: new Date(),
        completedAt: new Date(),
        status: 'COMPLETED',
      },
    });

    // Audit the deletion
    await auditLog(req, 'ACCOUNT_DELETED', {
      userId,
      details: { reason, anonymizedEmail },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}

/**
 * Request account deletion (with cooling off period)
 */
export async function requestAccountDeletion(
  req: Request,
  userId: string,
  reason?: string
): Promise<{ success: boolean; scheduledDate?: Date; error?: string }> {
  try {
    // Check for existing pending request
    const existingRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return {
        success: false,
        error: 'A deletion request is already pending',
        scheduledDate: existingRequest.scheduledDeletionAt || undefined,
      };
    }

    // Schedule deletion for 30 days from now (cooling off period)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);

    await prisma.accountDeletionRequest.create({
      data: {
        userId,
        reason,
        requestedAt: new Date(),
        scheduledDeletionAt: scheduledDate,
        status: 'PENDING',
      },
    });

    await auditLog(req, 'DATA_DELETED', {
      userId,
      details: { type: 'DELETION_REQUESTED', scheduledDate, reason },
    });

    return { success: true, scheduledDate };
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    return { success: false, error: 'Failed to request account deletion' };
  }
}

/**
 * Cancel pending account deletion
 */
export async function cancelAccountDeletion(
  req: Request,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const request = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      return { success: false, error: 'No pending deletion request found' };
    }

    await prisma.accountDeletionRequest.update({
      where: { id: request.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    await auditLog(req, 'DATA_DELETED', {
      userId,
      details: { type: 'DELETION_CANCELLED' },
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling account deletion:', error);
    return { success: false, error: 'Failed to cancel deletion request' };
  }
}

/**
 * Record user consent
 */
export async function recordConsent(
  userId: string,
  consentType: string,
  granted: boolean,
  details?: Record<string, any>
): Promise<void> {
  await prisma.userConsent.upsert({
    where: {
      userId_consentType: { userId, consentType },
    },
    update: {
      granted,
      grantedAt: granted ? new Date() : undefined,
      revokedAt: !granted ? new Date() : null,
      details,
    },
    create: {
      userId,
      consentType,
      granted,
      grantedAt: granted ? new Date() : new Date(),
      details,
    },
  });
}

/**
 * Check if user has given specific consent
 */
export async function hasConsent(userId: string, consentType: string): Promise<boolean> {
  const consent = await prisma.userConsent.findUnique({
    where: {
      userId_consentType: { userId, consentType },
    },
  });
  return consent?.granted ?? false;
}

/**
 * Get all consents for a user
 */
export async function getUserConsents(userId: string) {
  return prisma.userConsent.findMany({
    where: { userId },
  });
}

/**
 * Process scheduled deletions (run as cron job)
 */
export async function processScheduledDeletions(): Promise<number> {
  const now = new Date();

  const pendingDeletions = await prisma.accountDeletionRequest.findMany({
    where: {
      status: 'PENDING',
      scheduledDeletionAt: { lte: now },
    },
  });

  let processed = 0;

  for (const request of pendingDeletions) {
    // Create a mock request for audit logging
    const mockReq = { headers: {}, socket: { remoteAddress: 'system' } } as any;

    const result = await deleteUserAccount(mockReq, request.userId, request.reason || undefined);

    if (result.success) {
      processed++;
    }
  }

  return processed;
}
