'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  AuthState,
  AuthContextType,
  User,
  LoginCredentials,
  RegisterCredentials,
  ApiResponse,
  LoginResponse,
  RegisterResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; accessToken: string } }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage helpers
const TOKEN_KEY = 'vor_access_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // API helper with auth headers
  const authFetch = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = state.accessToken || getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh token
    });
  }, [state.accessToken]);

  // Refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        dispatch({ type: 'LOGOUT' });
        removeStoredToken();
        return false;
      }

      const data: ApiResponse<{ accessToken: string }> = await response.json();

      if (data.success && data.data?.accessToken) {
        setStoredToken(data.data.accessToken);
        // Fetch user data
        const userResponse = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${data.data.accessToken}` },
        });

        if (userResponse.ok) {
          const userData: ApiResponse<{ user: User }> = await userResponse.json();
          if (userData.success && userData.data?.user) {
            dispatch({
              type: 'SET_USER',
              payload: { user: userData.data.user, accessToken: data.data.accessToken },
            });
            return true;
          }
        }
      }

      dispatch({ type: 'LOGOUT' });
      removeStoredToken();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: 'LOGOUT' });
      removeStoredToken();
      return false;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data: ApiResponse<{ user: User }> = await response.json();
          if (data.success && data.data?.user) {
            dispatch({
              type: 'SET_USER',
              payload: { user: data.data.user, accessToken: token },
            });
            return;
          }
        }

        // Token might be expired, try refresh
        const refreshed = await refreshToken();
        if (!refreshed) {
          dispatch({ type: 'LOGOUT' });
          removeStoredToken();
        }
      } catch (error) {
        console.error('Auth init error:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, [refreshToken]);

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ requires2FA?: boolean } | void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data: ApiResponse<LoginResponse & { requires2FA?: boolean }> = await response.json();

      if (!response.ok || !data.success) {
        dispatch({
          type: 'SET_ERROR',
          payload: data.error?.message || 'Login failed',
        });
        return;
      }

      // Check if 2FA is required
      if (data.data?.requires2FA) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { requires2FA: true };
      }

      if (data.data?.user && data.data?.accessToken) {
        setStoredToken(data.data.accessToken);
        dispatch({
          type: 'SET_USER',
          payload: { user: data.data.user, accessToken: data.data.accessToken },
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Network error. Please try again.',
      });
    }
  }, []);

  // Register
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data: ApiResponse<RegisterResponse> = await response.json();

      if (!response.ok || !data.success) {
        dispatch({
          type: 'SET_ERROR',
          payload: data.error?.message || 'Registration failed',
        });
        return;
      }

      if (data.data) {
        setStoredToken(data.data.accessToken);
        dispatch({
          type: 'SET_USER',
          payload: { user: data.data.user, accessToken: data.data.accessToken },
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Network error. Please try again.',
      });
    }
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = state.accessToken || getStoredToken();
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeStoredToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, [state.accessToken]);

  // Clear error
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Update user
  const updateUser = useCallback((user: Partial<User>): void => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async (): Promise<void> => {
    const token = state.accessToken || getStoredToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ApiResponse<{ user: User }> = await response.json();
        if (data.success && data.data?.user) {
          dispatch({
            type: 'SET_USER',
            payload: { user: data.data.user, accessToken: token },
          });
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [state.accessToken]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route helper
export function useRequireAuth(redirectUrl = '/login') {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectUrl;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectUrl]);

  return auth;
}
