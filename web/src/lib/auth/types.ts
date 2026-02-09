// Auth types for VÖR Platform

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  location?: string | null;
  country?: string | null;
  status: 'active' | 'suspended' | 'deleted';
  accountStatus: 'active' | 'suspended' | 'deleted';
  emailVerified?: string | null | boolean;
  phoneVerified?: string | null;
  twoFactorEnabled: boolean;
  identityVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  membershipLevel: 'free' | 'investor' | 'pro' | 'agent' | 'premium';
  membershipExpiresAt?: string | null;
  userType: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  totpCode?: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ requires2FA?: boolean } | void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    path: string;
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  message: string;
}
