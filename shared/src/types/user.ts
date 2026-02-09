// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  country?: string;
  status: UserStatus;
  emailVerified?: string;
  phoneVerified?: string;
  twoFactorEnabled: boolean;
  identityVerified: boolean;
  kycStatus: KYCStatus;
  membershipLevel: MembershipLevel;
  membershipExpiresAt?: string;
  userType: UserType[];
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = 'active' | 'suspended' | 'deleted';
export type KYCStatus = 'pending' | 'approved' | 'rejected';
export type MembershipLevel = 'free' | 'investor' | 'pro' | 'agent';
export type UserType = 'individual' | 'agent' | 'lender' | 'sponsor';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Health Check
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  environment: string;
  database: 'connected' | 'disconnected';
  version?: string;
}
