// Email service for VÖR Platform
// Uses SendGrid in production, console logging in development

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@vor-platform.com';
const FROM_NAME = process.env.FROM_NAME || 'VÖR Platform';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Send an email
 * Uses SendGrid in production, logs to console in development
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development without SendGrid, just log
  if (!SENDGRID_API_KEY || process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:');
    console.log(`  To: ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body: ${options.text || options.html.substring(0, 200)}...`);
    return true;
  }

  try {
    // Dynamic import for SendGrid (only loaded when needed)
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(SENDGRID_API_KEY);

    await sgMail.default.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Generate email template wrapper
 */
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VÖR Platform</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 32px;
      color: #be185d;
      margin: 0;
    }
    h2 {
      font-size: 24px;
      color: #111827;
      margin-bottom: 16px;
    }
    p {
      color: #4b5563;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #be185d 0%, #a855f7 100%);
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }
    .highlight {
      background: #fdf2f8;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .code {
      font-family: monospace;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 16px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>VÖR</h1>
      </div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} VÖR Platform. All rights reserved.</p>
        <p>Building generational wealth through real estate.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const content = `
    <h2>Welcome to VÖR, ${firstName}! 🎉</h2>
    <p>Thank you for joining the VÖR community. We're excited to help you build generational wealth through real estate.</p>
    <p>Please verify your email address to get started:</p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </div>
    <div class="highlight">
      <p style="margin: 0; font-size: 14px;">
        Or copy and paste this link into your browser:<br/>
        <a href="${verifyUrl}" style="color: #be185d; word-break: break-all;">${verifyUrl}</a>
      </p>
    </div>
    <p style="font-size: 14px; color: #6b7280;">
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your VÖR account',
    html: emailTemplate(content),
    text: `Welcome to VÖR, ${firstName}! Please verify your email by visiting: ${verifyUrl}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <div class="highlight">
      <p style="margin: 0; font-size: 14px;">
        Or copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color: #be185d; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <p style="font-size: 14px; color: #6b7280;">
      This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your VÖR password',
    html: emailTemplate(content),
    text: `Hi ${firstName}, Reset your password by visiting: ${resetUrl}. This link expires in 1 hour.`,
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const dashboardUrl = `${APP_URL}/dashboard`;

  const content = `
    <h2>You're All Set, ${firstName}! 🏠</h2>
    <p>Your email has been verified and your VÖR account is now fully activated.</p>
    <p>Here's what you can do next:</p>
    <ul style="color: #4b5563; margin: 16px 0;">
      <li>Complete your profile to get personalized recommendations</li>
      <li>Browse investment properties in your area</li>
      <li>Connect with other women investors in our community</li>
      <li>Explore co-investment opportunities</li>
    </ul>
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      Have questions? Our support team is here to help. Just reply to this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to VÖR - Let\'s Build Wealth Together! 🎉',
    html: emailTemplate(content),
    text: `Welcome to VÖR, ${firstName}! Your account is now verified. Visit your dashboard: ${dashboardUrl}`,
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const content = `
    <h2>Password Changed Successfully</h2>
    <p>Hi ${firstName},</p>
    <p>Your VÖR account password was successfully changed.</p>
    <div class="highlight">
      <p style="margin: 0;">
        <strong>When:</strong> ${new Date().toLocaleString()}<br/>
        <strong>Account:</strong> ${email}
      </p>
    </div>
    <p style="font-size: 14px; color: #6b7280;">
      If you didn't make this change, please contact our support team immediately and reset your password.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Your VÖR password was changed',
    html: emailTemplate(content),
    text: `Hi ${firstName}, Your VÖR password was changed on ${new Date().toLocaleString()}. If this wasn't you, please contact support immediately.`,
  });
}
