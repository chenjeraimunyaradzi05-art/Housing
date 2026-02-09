// VÖR Platform Constants

export const APP_NAME = 'VÖR';
export const APP_TAGLINE = 'Women-Centered Real Estate & Generational Wealth';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Authentication
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const PASSWORD_MIN_LENGTH = 12;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

// Design System Colors
export const COLORS = {
  // Primary
  rose: '#E91E8C',
  roseDark: '#D63384',
  blushPink: '#FFB6C1',
  burgundy: '#8B1C62',
  
  // Secondary
  lavender: '#9D6BA6',
  periwinkle: '#BCA8D8',
  deepPurple: '#5A3B6F',
  
  // Tertiary
  teal: '#20B2AA',
  tealDark: '#008080',
  sageGreen: '#9BAA9F',
  champagneGold: '#DAA520',
  
  // Neutrals
  white: '#FFFFFF',
  softWhite: '#F8F8F8',
  lightGray: '#E8E8E8',
  mediumGray: '#999999',
  darkGray: '#333333',
  black: '#000000',
  
  // Status
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
} as const;

// Membership Levels
export const MEMBERSHIP_LEVELS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic property search',
      'Educational content',
      'Community access',
      'Basic financial tools',
    ],
    limits: {
      savedProperties: 5,
      coInvestment: false,
    },
  },
  investor: {
    name: 'Investor',
    price: 9.99,
    features: [
      'Unlimited property search',
      'All financial tools',
      'Co-investment opportunities',
      'Advanced analytics',
      'Agent directory access',
    ],
    limits: {
      savedProperties: -1, // unlimited
      coInvestment: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 24.99,
    features: [
      'Everything in Investor',
      'Priority customer support',
      'Advanced AI recommendations',
      'Tax return filing (single)',
      'Financial planning consultation',
      '10% discount on partner services',
    ],
    limits: {
      savedProperties: -1,
      coInvestment: true,
    },
  },
  agent: {
    name: 'Agent',
    price: 99.99,
    features: [
      'Professional agent tools',
      'CRM integration',
      'Listing management',
      'Client analytics',
      'Lead management',
      'Commission splitting',
    ],
    limits: {
      savedProperties: -1,
      coInvestment: true,
    },
  },
} as const;

// Regex Patterns
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]+$/,
  username: /^[a-zA-Z0-9_]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
