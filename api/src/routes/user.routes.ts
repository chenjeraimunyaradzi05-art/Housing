import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { SuccessResponses, ErrorResponses } from '../utils/response';
import { authenticate } from '../middleware/auth';
import { uploadToS3, deleteFromS3, getSignedUrl } from '../lib/storage';
import { sendPasswordChangedEmail } from '../lib/email';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

/**
 * GET /api/users/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        phone: true,
        profileImage: true,
        bio: true,
        location: true,
        country: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        identityVerified: true,
        kycStatus: true,
        membershipLevel: true,
        membershipExpiresAt: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return ErrorResponses.notFound(res, 'User');
    }

    return SuccessResponses.ok(res, { user });
  } catch (error) {
    console.error('Get user error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * PUT /api/users/me
 * Update current user's profile
 */
router.put('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      username,
      dateOfBirth,
      phone,
      bio,
      location,
      country,
    } = req.body;

    // Validate username if provided
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return ErrorResponses.badRequest(
          res,
          'Username must be 3-20 characters and contain only letters, numbers, and underscores'
        );
      }

      // Check if username is taken
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username.toLowerCase(),
          NOT: { id: req.user!.id },
        },
      });

      if (existingUser) {
        return ErrorResponses.conflict(res, 'Username already taken');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username.toLowerCase();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (country !== undefined) updateData.country = country;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        phone: true,
        profileImage: true,
        bio: true,
        location: true,
        country: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        identityVerified: true,
        kycStatus: true,
        membershipLevel: true,
        membershipExpiresAt: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return SuccessResponses.ok(res, { user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/users/me/avatar
 * Upload user avatar
 */
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return ErrorResponses.badRequest(res, 'No file uploaded');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { profileImage: true },
    });

    // Delete old avatar if exists
    if (user?.profileImage) {
      const oldKey = user.profileImage.split('/').pop();
      if (oldKey) {
        await deleteFromS3(`avatars/${oldKey}`).catch(console.error);
      }
    }

    // Upload new avatar
    const filename = `${req.user!.id}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    const key = `avatars/${filename}`;

    const url = await uploadToS3(req.file.buffer, key, req.file.mimetype);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { profileImage: url },
      select: {
        id: true,
        profileImage: true,
      },
    });

    return SuccessResponses.ok(res, {
      profileImage: updatedUser.profileImage,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    if (error instanceof Error && error.message.includes('Invalid file type')) {
      return ErrorResponses.badRequest(res, error.message);
    }
    return ErrorResponses.internalError(res);
  }
});

/**
 * DELETE /api/users/me/avatar
 * Delete user avatar
 */
router.delete('/me/avatar', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { profileImage: true },
    });

    if (!user?.profileImage) {
      return ErrorResponses.badRequest(res, 'No avatar to delete');
    }

    // Delete from S3
    const key = user.profileImage.split('/').slice(-2).join('/');
    await deleteFromS3(key).catch(console.error);

    // Update user
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { profileImage: null },
    });

    return SuccessResponses.ok(res, { message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * PUT /api/users/me/password
 * Change user password
 */
router.put('/me/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ErrorResponses.badRequest(res, 'Current password and new password are required');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return ErrorResponses.badRequest(res, passwordValidation.errors.join('. '));
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, firstName: true, passwordHash: true },
    });

    if (!user) {
      return ErrorResponses.notFound(res, 'User');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return ErrorResponses.unauthorized(res, 'Current password is incorrect');
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Send notification email
    sendPasswordChangedEmail(user.email, user.firstName).catch(console.error);

    return SuccessResponses.ok(res, {
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /api/users/me/settings
 * Get user settings (notifications, privacy, preferences)
 */
router.get('/me/settings', authenticate, async (req: Request, res: Response) => {
  try {
    // Try to get existing settings, or return defaults
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
    });

    // If no settings exist, create defaults
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.user!.id },
      });
    }

    // Transform to nested structure for frontend
    const formattedSettings = {
      notifications: {
        email: {
          marketing: settings.emailMarketing,
          updates: settings.emailUpdates,
          security: settings.emailSecurity,
          investmentAlerts: settings.emailInvestmentAlerts,
          communityActivity: settings.emailCommunityDigest,
        },
        push: {
          enabled: settings.pushEnabled,
          investmentAlerts: settings.pushInvestmentAlerts,
          messages: settings.pushMessages,
        },
      },
      privacy: {
        profileVisibility: settings.profileVisibility,
        showInvestments: settings.showInvestments,
        showLocation: settings.showLocation,
        allowMessages: settings.allowMessages,
      },
      preferences: {
        language: settings.language,
        currency: settings.currency,
        timezone: settings.timezone,
      },
    };

    return SuccessResponses.ok(res, { settings: formattedSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * PUT /api/users/me/settings
 * Update user settings
 */
router.put('/me/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const { notifications, privacy, preferences } = req.body;

    // Build update data from nested structure
    const updateData: Record<string, unknown> = {};

    // Email notifications
    if (notifications?.email) {
      if (notifications.email.marketing !== undefined) updateData.emailMarketing = notifications.email.marketing;
      if (notifications.email.updates !== undefined) updateData.emailUpdates = notifications.email.updates;
      if (notifications.email.security !== undefined) updateData.emailSecurity = notifications.email.security;
      if (notifications.email.investmentAlerts !== undefined) updateData.emailInvestmentAlerts = notifications.email.investmentAlerts;
      if (notifications.email.communityActivity !== undefined) updateData.emailCommunityDigest = notifications.email.communityActivity;
    }

    // Push notifications
    if (notifications?.push) {
      if (notifications.push.enabled !== undefined) updateData.pushEnabled = notifications.push.enabled;
      if (notifications.push.investmentAlerts !== undefined) updateData.pushInvestmentAlerts = notifications.push.investmentAlerts;
      if (notifications.push.messages !== undefined) updateData.pushMessages = notifications.push.messages;
    }

    // Privacy
    if (privacy) {
      if (privacy.profileVisibility !== undefined) updateData.profileVisibility = privacy.profileVisibility;
      if (privacy.showInvestments !== undefined) updateData.showInvestments = privacy.showInvestments;
      if (privacy.showLocation !== undefined) updateData.showLocation = privacy.showLocation;
      if (privacy.allowMessages !== undefined) updateData.allowMessages = privacy.allowMessages;
    }

    // Preferences
    if (preferences) {
      if (preferences.language !== undefined) updateData.language = preferences.language;
      if (preferences.currency !== undefined) updateData.currency = preferences.currency;
      if (preferences.timezone !== undefined) updateData.timezone = preferences.timezone;
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...updateData,
      },
      update: updateData,
    });

    // Transform to nested structure for frontend
    const formattedSettings = {
      notifications: {
        email: {
          marketing: settings.emailMarketing,
          updates: settings.emailUpdates,
          security: settings.emailSecurity,
          investmentAlerts: settings.emailInvestmentAlerts,
          communityActivity: settings.emailCommunityDigest,
        },
        push: {
          enabled: settings.pushEnabled,
          investmentAlerts: settings.pushInvestmentAlerts,
          messages: settings.pushMessages,
        },
      },
      privacy: {
        profileVisibility: settings.profileVisibility,
        showInvestments: settings.showInvestments,
        showLocation: settings.showLocation,
        allowMessages: settings.allowMessages,
      },
      preferences: {
        language: settings.language,
        currency: settings.currency,
        timezone: settings.timezone,
      },
    };

    return SuccessResponses.ok(res, {
      settings: formattedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * DELETE /api/users/me
 * Delete user account (soft delete)
 */
router.delete('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return ErrorResponses.badRequest(res, 'Password is required to delete account');
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return ErrorResponses.notFound(res, 'User');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return ErrorResponses.unauthorized(res, 'Invalid password');
    }

    // Soft delete - set status to deleted
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { status: 'deleted' },
    });

    // Delete all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id },
    });

    return SuccessResponses.ok(res, { message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /api/users/:id/profile
 * Get a user's public profile
 */
router.get('/:id/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const profileUserId = String(req.params.id);
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return ErrorResponses.unauthorized(res);
    }

    const user = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        bio: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            followedBy: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return ErrorResponses.notFound(res, 'User');
    }

    // Check if current user is following this user
    const isFollowing = currentUserId !== profileUserId ? await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: profileUserId,
        },
      },
    }) : null;

    return SuccessResponses.ok(res, {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.profileImage,
        bio: user.bio,
        phone: user.phone,
        createdAt: user.createdAt,
        followerCount: user._count.followedBy,
        followingCount: user._count.following,
        postCount: user._count.posts,
        isFollowing: !!isFollowing,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /api/users/discover
 * Discover users to follow
 */
router.get('/discover', authenticate, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return ErrorResponses.unauthorized(res);
    }
    const search = req.query.search as string | undefined;

    const whereClause: {
      id: { not: string };
      status: string;
      OR?: Array<{ firstName?: { contains: string; mode: 'insensitive' }; lastName?: { contains: string; mode: 'insensitive' }; username?: { contains: string; mode: 'insensitive' } }>;
    } = {
      id: { not: currentUserId },
      status: 'active',
    };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: 20,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        bio: true,
        _count: {
          select: {
            followedBy: true,
          },
        },
        followedBy: {
          where: { followerId: currentUserId },
          select: { followerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.profileImage,
      bio: u.bio,
      followerCount: u._count.followedBy,
      isFollowing: u.followedBy.length > 0,
    }));

    return SuccessResponses.ok(res, { users: formattedUsers });
  } catch (error) {
    console.error('Discover users error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/users/me/onboarding
 * Save onboarding preferences and mark onboarding complete
 */
router.post('/me/onboarding', authenticate, async (req: Request, res: Response) => {
  try {
    const { experience, goals, preferences, notificationPreferences } = req.body;

    // Update user settings with onboarding preferences
    const updateData: Record<string, unknown> = {};

    if (notificationPreferences) {
      if (notificationPreferences.emailMarketing !== undefined) {
        updateData.emailMarketing = notificationPreferences.emailMarketing;
      }
      if (notificationPreferences.emailUpdates !== undefined) {
        updateData.emailUpdates = notificationPreferences.emailUpdates;
      }
      if (notificationPreferences.pushEnabled !== undefined) {
        updateData.pushEnabled = notificationPreferences.pushEnabled;
      }
      if (notificationPreferences.emailInvestmentAlerts !== undefined) {
        updateData.emailInvestmentAlerts = notificationPreferences.emailInvestmentAlerts;
      }
    }

    // Upsert user settings with onboarding data
    await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...updateData,
      },
      update: updateData,
    });

    // Update user profile with onboarding metadata
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        bio: experience ? `Experience: ${experience}` : undefined,
      },
    });

    return SuccessResponses.ok(res, {
      message: 'Onboarding completed successfully',
      onboarding: {
        experience,
        goals,
        preferences,
        completed: true,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
