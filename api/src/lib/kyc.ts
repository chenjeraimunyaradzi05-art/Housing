/**
 * KYC (Know Your Customer) Verification System
 * Basic identity verification for regulatory compliance
 */

import prisma from './prisma';
import { auditLog } from './auditLog';
import { Request } from 'express';

export type KYCStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
export type DocumentType = 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';

interface KYCDocument {
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  uploadedAt: Date;
}

interface KYCSubmission {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents: KYCDocument[];
  ssn?: string; // Last 4 digits only
  taxId?: string;
}

interface KYCVerificationResult {
  success: boolean;
  status: KYCStatus;
  message: string;
  verificationId?: string;
}

/**
 * Get current KYC status for a user
 */
export async function getKYCStatus(userId: string): Promise<{
  status: KYCStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedReason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      kycStatus: true,
      kycApprovedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const verification = await prisma.kYCVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    status: user.kycStatus as KYCStatus,
    submittedAt: verification?.createdAt,
    approvedAt: user.kycApprovedAt || undefined,
    rejectedReason: verification?.rejectionReason || undefined,
  };
}

/**
 * Submit KYC verification documents
 */
export async function submitKYC(
  req: Request,
  submission: KYCSubmission
): Promise<KYCVerificationResult> {
  try {
    const { userId, firstName, lastName, dateOfBirth, nationality, address, documents, ssn, taxId } = submission;

    // Validate minimum requirements
    if (!documents || documents.length < 1) {
      return {
        success: false,
        status: 'pending',
        message: 'At least one identification document is required',
      };
    }

    // Check for existing pending submission
    const existingVerification = await prisma.kYCVerification.findFirst({
      where: {
        userId,
        status: { in: ['submitted', 'under_review'] },
      },
    });

    if (existingVerification) {
      return {
        success: false,
        status: existingVerification.status as KYCStatus,
        message: 'A KYC verification is already in progress',
        verificationId: existingVerification.id,
      };
    }

    // Create verification record
    const verification = await prisma.kYCVerification.create({
      data: {
        userId,
        firstName,
        lastName,
        dateOfBirth,
        nationality,
        addressStreet: address.street,
        addressCity: address.city,
        addressState: address.state,
        addressPostalCode: address.postalCode,
        addressCountry: address.country,
        documents: documents as any,
        ssnLast4: ssn,
        taxId,
        status: 'submitted',
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'submitted' },
    });

    // Audit log
    await auditLog(req, 'KYC_SUBMITTED', {
      userId,
      resourceType: 'KYCVerification',
      resourceId: verification.id,
      details: {
        documentCount: documents.length,
        documentTypes: documents.map(d => d.type),
      },
    });

    return {
      success: true,
      status: 'submitted',
      message: 'KYC verification submitted successfully. Review typically takes 1-3 business days.',
      verificationId: verification.id,
    };
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return {
      success: false,
      status: 'pending',
      message: 'Failed to submit KYC verification',
    };
  }
}

/**
 * Approve KYC verification (admin only)
 */
export async function approveKYC(
  req: Request,
  verificationId: string,
  adminUserId: string,
  notes?: string
): Promise<KYCVerificationResult> {
  try {
    const verification = await prisma.kYCVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return {
        success: false,
        status: 'pending',
        message: 'Verification not found',
      };
    }

    if (verification.status === 'approved') {
      return {
        success: false,
        status: 'approved',
        message: 'Verification is already approved',
      };
    }

    // Update verification
    await prisma.kYCVerification.update({
      where: { id: verificationId },
      data: {
        status: 'approved',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        kycStatus: 'approved',
        kycApprovedAt: new Date(),
        identityVerified: true,
        identityVerifiedAt: new Date(),
      },
    });

    // Audit log
    await auditLog(req, 'KYC_APPROVED', {
      userId: verification.userId,
      resourceType: 'KYCVerification',
      resourceId: verificationId,
      details: {
        reviewedBy: adminUserId,
        notes,
      },
    });

    return {
      success: true,
      status: 'approved',
      message: 'KYC verification approved',
      verificationId,
    };
  } catch (error) {
    console.error('Error approving KYC:', error);
    return {
      success: false,
      status: 'pending',
      message: 'Failed to approve KYC verification',
    };
  }
}

/**
 * Reject KYC verification (admin only)
 */
export async function rejectKYC(
  req: Request,
  verificationId: string,
  adminUserId: string,
  reason: string
): Promise<KYCVerificationResult> {
  try {
    const verification = await prisma.kYCVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return {
        success: false,
        status: 'pending',
        message: 'Verification not found',
      };
    }

    // Update verification
    await prisma.kYCVerification.update({
      where: { id: verificationId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    // Update user
    await prisma.user.update({
      where: { id: verification.userId },
      data: { kycStatus: 'rejected' },
    });

    // Audit log
    await auditLog(req, 'KYC_REJECTED', {
      userId: verification.userId,
      resourceType: 'KYCVerification',
      resourceId: verificationId,
      details: {
        reviewedBy: adminUserId,
        reason,
      },
    });

    return {
      success: true,
      status: 'rejected',
      message: 'KYC verification rejected',
      verificationId,
    };
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    return {
      success: false,
      status: 'pending',
      message: 'Failed to reject KYC verification',
    };
  }
}

/**
 * Get pending KYC verifications (admin only)
 */
export async function getPendingVerifications(limit: number = 50, offset: number = 0) {
  const [verifications, total] = await Promise.all([
    prisma.kYCVerification.findMany({
      where: {
        status: { in: ['submitted', 'under_review'] },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.kYCVerification.count({
      where: {
        status: { in: ['submitted', 'under_review'] },
      },
    }),
  ]);

  return { verifications, total, limit, offset };
}

/**
 * Check if user is KYC verified
 */
export async function isKYCVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  });
  return user?.kycStatus === 'approved';
}

/**
 * Require KYC for certain actions
 */
export async function requireKYC(userId: string): Promise<void> {
  const verified = await isKYCVerified(userId);
  if (!verified) {
    throw new Error('KYC verification required for this action');
  }
}
