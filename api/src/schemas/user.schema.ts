import { z } from 'zod';

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be at most 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters')
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number')
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, 'Country must be at most 100 characters')
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .datetime()
    .optional()
    .nullable(),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
