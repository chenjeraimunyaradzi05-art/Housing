import rateLimit from 'express-rate-limit';
import config from '../config';

/**
 * Standard rate limiter for most API endpoints
 * 100 requests per 15 minutes by default
 */
export const standardLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  // Using default keyGenerator which handles IPv6 properly
});

/**
 * Strict rate limiter for sensitive endpoints (login, register, password reset)
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Very strict limiter for password reset
 * 3 requests per hour
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too Many Requests',
    message: 'Too many password reset attempts. Please try again in an hour.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generous limiter for public endpoints (property listings, etc.)
 * 200 requests per 15 minutes
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please slow down.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
