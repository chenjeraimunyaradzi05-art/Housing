/**
 * Application configuration
 * Centralizes all environment variables and configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarAsInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

function getEnvVarAsBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

export const config = {
  // Server
  env: getEnvVar('NODE_ENV', 'development'),
  port: getEnvVarAsInt('PORT', 5000),
  apiUrl: getEnvVar('API_URL', 'http://localhost:5000'),

  // Frontend
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),

  // Database
  databaseUrl: getEnvVar('DATABASE_URL'),

  // Redis
  redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6381'),

  // JWT
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'dev-secret-key-change-in-production'),
    accessExpiresIn: getEnvVar('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // Bcrypt
  bcryptSaltRounds: getEnvVarAsInt('BCRYPT_SALT_ROUNDS', 12),

  // Email
  email: {
    sendgridApiKey: getEnvVar('SENDGRID_API_KEY', ''),
    from: getEnvVar('EMAIL_FROM', 'noreply@vor.com'),
    fromName: getEnvVar('EMAIL_FROM_NAME', 'VÖR'),
  },

  // AWS S3
  aws: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID', ''),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY', ''),
    s3Bucket: getEnvVar('AWS_S3_BUCKET', 'vor-dev-storage'),
    region: getEnvVar('AWS_REGION', 'us-east-1'),
  },

  // Stripe
  stripe: {
    secretKey: getEnvVar('STRIPE_SECRET_KEY', ''),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', ''),
  },

  // Plaid
  plaid: {
    clientId: getEnvVar('PLAID_CLIENT_ID', ''),
    secret: getEnvVar('PLAID_SECRET', ''),
    environment: getEnvVar('PLAID_ENV', 'sandbox'),
  },

  // Sentry
  sentry: {
    dsn: getEnvVar('SENTRY_DSN', ''),
    environment: getEnvVar('SENTRY_ENVIRONMENT', 'development'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getEnvVarAsInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    maxRequests: getEnvVarAsInt('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  // Feature Flags
  features: {
    coInvest: getEnvVarAsBool('ENABLE_CO_INVEST', true),
    safeHousing: getEnvVarAsBool('ENABLE_SAFE_HOUSING', true),
    streaming: getEnvVarAsBool('ENABLE_STREAMING', false),
  },

  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

export default config;
