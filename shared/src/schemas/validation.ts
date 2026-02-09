import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address').toLowerCase();

// Password validation
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

// Phone validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: usernameSchema.optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Property search schema
export const propertySearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  propertyType: z.enum(['residential', 'commercial', 'multi-family', 'land']).optional(),
  status: z.enum(['available', 'rented', 'for_sale', 'development']).optional(),
  ...paginationSchema.shape,
});

// Investment pool schema
export const createPoolSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  propertyId: uuidSchema,
  targetAmount: z.number().min(1000, 'Minimum target amount is $1,000'),
  minInvestment: z.number().min(100, 'Minimum investment is $100'),
  maxInvestment: z.number().optional(),
  expectedReturn: z.number().min(0).max(100).optional(),
});

// Export types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type CreatePoolInput = z.infer<typeof createPoolSchema>;
