import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateTokenPair, verifyToken } from '../utils/jwt';
import { SuccessResponses, ErrorResponses } from '../utils/response';
import { authenticate } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';
import * as twoFactor from '../lib/twoFactor';

const router = Router();

// Token expiry times
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * POST /api/auth/register
 * Register a new user
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !username || !password || !firstName || !lastName) {
      return ErrorResponses.badRequest(res, 'All fields are required: email, username, password, firstName, lastName');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ErrorResponses.badRequest(res, 'Invalid email format');
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return ErrorResponses.badRequest(res, 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return ErrorResponses.badRequest(res, passwordValidation.errors.join('. '));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return ErrorResponses.conflict(res, 'Email already registered');
      }
      return ErrorResponses.conflict(res, 'Username already taken');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Create verification token
    const verificationToken = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token: verificationToken,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    // Send verification email (async, don't block)
    sendVerificationEmail(user.email, user.firstName, verificationToken).catch(console.error);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return SuccessResponses.created(res, {
      user,
      accessToken,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 * Rate limited: 5 attempts per 15 minutes
 * Supports 2FA verification
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, totpCode } = req.body;

    // Validate required fields
    if (!email || !password) {
      return ErrorResponses.badRequest(res, 'Email and password are required');
    }

    // Find user with 2FA fields
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        status: true,
        emailVerified: true,
        profileImage: true,
        membershipLevel: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return ErrorResponses.unauthorized(res, 'Invalid email or password');
    }

    // Check account status
    if (user.status !== 'active') {
      return ErrorResponses.forbidden(res, 'Account is not active. Please contact support.');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return ErrorResponses.unauthorized(res, 'Invalid email or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // If 2FA is enabled, require TOTP code
      if (!totpCode) {
        return SuccessResponses.ok(res, {
          requires2FA: true,
          message: 'Two-factor authentication required',
        });
      }

      // Verify TOTP code
      const isValidTotp = twoFactor.verifyToken(user.twoFactorSecret, totpCode);
      if (!isValidTotp) {
        return ErrorResponses.unauthorized(res, 'Invalid authentication code');
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    // Remove sensitive fields from response
    const { passwordHash: _, twoFactorSecret: __, ...userWithoutSensitive } = user;

    return SuccessResponses.ok(res, {
      user: userWithoutSensitive,
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate refresh token
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Delete all refresh tokens for the user (optional: logout from all devices)
    // await prisma.refreshToken.deleteMany({
    //   where: { userId: req.user!.id },
    // });

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return SuccessResponses.ok(res, { message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return ErrorResponses.unauthorized(res, 'Refresh token required');
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      return ErrorResponses.unauthorized(res, 'Invalid refresh token');
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (!storedToken) {
      return ErrorResponses.unauthorized(res, 'Refresh token not found');
    }

    // Check if token is expired in database
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return ErrorResponses.unauthorized(res, 'Refresh token expired');
    }

    // Check user status
    if (storedToken.user.status !== 'active') {
      return ErrorResponses.forbidden(res, 'Account is not active');
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      storedToken.user.id,
      storedToken.user.email
    );

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    return SuccessResponses.ok(res, { accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return ErrorResponses.badRequest(res, 'Verification token required');
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return ErrorResponses.badRequest(res, 'Invalid verification token');
    }

    if (verificationToken.type !== 'email_verification') {
      return ErrorResponses.badRequest(res, 'Invalid token type');
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
      return ErrorResponses.badRequest(res, 'Verification token expired. Please request a new one.');
    }

    // Update user
    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    // Delete verification token
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });

    return SuccessResponses.ok(res, { message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ErrorResponses.badRequest(res, 'Email required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true, emailVerified: true },
    });

    if (!user) {
      // Don't reveal if user exists
      return SuccessResponses.ok(res, { message: 'If the email exists, a verification link has been sent.' });
    }

    if (user.emailVerified) {
      return ErrorResponses.badRequest(res, 'Email already verified');
    }

    // Delete existing verification tokens
    await prisma.verificationToken.deleteMany({
      where: { email: user.email, type: 'email_verification' },
    });

    // Create new verification token
    const verificationToken = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token: verificationToken,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.firstName, verificationToken);

    return SuccessResponses.ok(res, { message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Rate limited: 3 attempts per hour
 */
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ErrorResponses.badRequest(res, 'Email required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true, status: true },
    });

    // Always return success to prevent email enumeration
    if (!user || user.status !== 'active') {
      return SuccessResponses.ok(res, { message: 'If the email exists, a password reset link has been sent.' });
    }

    // Delete existing password reset tokens
    await prisma.verificationToken.deleteMany({
      where: { email: user.email, type: 'password_reset' },
    });

    // Create password reset token
    const resetToken = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token: resetToken,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.firstName, resetToken);

    return SuccessResponses.ok(res, { message: 'If the email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return ErrorResponses.badRequest(res, 'Token and password required');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return ErrorResponses.badRequest(res, passwordValidation.errors.join('. '));
    }

    // Find reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return ErrorResponses.badRequest(res, 'Invalid reset token');
    }

    if (resetToken.type !== 'password_reset') {
      return ErrorResponses.badRequest(res, 'Invalid token type');
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: resetToken.id } });
      return ErrorResponses.badRequest(res, 'Reset token expired. Please request a new one.');
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    });

    // Delete reset token
    await prisma.verificationToken.delete({ where: { id: resetToken.id } });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { user: { email: resetToken.email } },
    });

    return SuccessResponses.ok(res, { message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return ErrorResponses.internalError(res);
  }
});

/**
 * GET /api/auth/me
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
      return ErrorResponses.notFound(res, 'User not found');
    }

    return SuccessResponses.ok(res, { user });
  } catch (error) {
    console.error('Get me error:', error);
    return ErrorResponses.internalError(res);
  }
});

export default router;
