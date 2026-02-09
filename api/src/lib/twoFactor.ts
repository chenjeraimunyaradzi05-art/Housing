/**
 * Two-Factor Authentication (2FA) with TOTP
 * Uses Google Authenticator compatible TOTP tokens
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import prisma from './prisma';

// Configure TOTP settings
authenticator.options = {
  digits: 6,
  step: 30, // 30 second time step
  window: 1, // Allow 1 step before/after for clock drift
};

const APP_NAME = 'VÖR Platform';

interface TwoFactorSetupResult {
  secret: string;
  qrCodeDataUrl: string;
  manualEntryKey: string;
}

interface TwoFactorVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a new 2FA secret for a user
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTotpUri(email: string, secret: string): string {
  return authenticator.keyuri(email, APP_NAME, secret);
}

/**
 * Generate QR code data URL for authenticator apps
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpAuthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Set up 2FA for a user (generates secret but doesn't enable yet)
 */
export async function setup2FA(userId: string, email: string): Promise<TwoFactorSetupResult> {
  const secret = generateSecret();
  const otpAuthUrl = generateTotpUri(email, secret);
  const qrCodeDataUrl = await generateQRCode(otpAuthUrl);

  // Store the secret temporarily (not enabled until verified)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  // Format secret for manual entry (groups of 4)
  const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;

  return {
    secret,
    qrCodeDataUrl,
    manualEntryKey,
  };
}

/**
 * Verify a TOTP token
 */
export function verifyToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
}

/**
 * Enable 2FA for a user after verifying initial token
 */
export async function enable2FA(userId: string, token: string): Promise<TwoFactorVerifyResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.twoFactorEnabled) {
      return { success: false, error: '2FA is already enabled' };
    }

    if (!user.twoFactorSecret) {
      return { success: false, error: '2FA setup not initiated. Please start setup first.' };
    }

    // Verify the token
    const isValid = verifyToken(user.twoFactorSecret, token);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string, token: string): Promise<TwoFactorVerifyResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.twoFactorEnabled) {
      return { success: false, error: '2FA is not enabled' };
    }

    if (!user.twoFactorSecret) {
      return { success: false, error: 'No 2FA secret found' };
    }

    // Verify the token before disabling
    const isValid = verifyToken(user.twoFactorSecret, token);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Disable 2FA and remove secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
}

/**
 * Verify 2FA token during login
 */
export async function verify2FALogin(userId: string, token: string): Promise<TwoFactorVerifyResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: '2FA is not enabled for this account' };
    }

    const isValid = verifyToken(user.twoFactorSecret, token);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    return { success: false, error: 'Failed to verify 2FA' };
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });
  return user?.twoFactorEnabled ?? false;
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');
    codes.push(code);
  }
  return codes;
}
