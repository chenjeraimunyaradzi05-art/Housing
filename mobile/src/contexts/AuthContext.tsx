import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  membershipLevel: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricAvailable: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkAuth();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const checkAuth = async () => {
    try {
      await api.init();
      const token = await SecureStore.getItemAsync('accessToken');

      if (token) {
        const response = await api.get<{ user: User }>('/api/users/me');
        if (response.success && response.data) {
          setUser(response.data.user);
        } else {
          await SecureStore.deleteItemAsync('accessToken');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{ user: User; accessToken: string }>('/api/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        api.setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Login failed'
      };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await api.post<{ user: User; accessToken: string }>('/api/auth/register', data);

      if (response.success && response.data) {
        api.setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Registration failed'
      };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Ignore error
    } finally {
      api.setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await api.get<{ user: User }>('/api/users/me');
    if (response.success && response.data) {
      setUser(response.data.user);
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async () => {
    if (!biometricAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access VÖR',
      fallbackLabel: 'Use Password',
    });

    return result.success;
  }, [biometricAvailable]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        biometricAvailable,
        login,
        register,
        logout,
        refreshUser,
        authenticateWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
