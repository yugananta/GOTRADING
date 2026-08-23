import React, { createContext, useContext, useState, useEffect } from 'react';
import { httpClient } from '../services/httpClient';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'ib' | 'OWNER' | 'ADMIN' | 'FINANCE' | 'IB_MANAGER' | 'SUPPORT';
  permissions?: string[];
  exp?: number;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Initial token validation on app mount
  isLoggingIn: boolean; // Login request in progress
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): CurrentUser | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('gotrading_access_token'));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('gotrading_access_token');
      if (token) {
        const user = parseJwt(token);
        if (user && (!user.exp || user.exp * 1000 > Date.now())) {
          setAccessToken(token);
          setCurrentUser(user);
        } else {
          // Token expired
          localStorage.removeItem('gotrading_access_token');
          localStorage.removeItem('gotrading_refresh_token');
          setAccessToken(null);
          setCurrentUser(null);
        }
      } else {
        setAccessToken(null);
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    checkToken();

    const handleUnauthorized = () => {
      setAccessToken(null);
      setCurrentUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const clearError = () => {
    setError(null);
  };

  const login = async (identifier: string, pass: string) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await httpClient.post('/api/auth/login', {
        email: identifier,
        password: pass,
      });

      const { accessToken: token, refreshToken, user } = res.data;
      if (!token) {
        throw new Error('Format response dari server tidak valid: Access token tidak ditemukan.');
      }

      localStorage.setItem('gotrading_access_token', token);
      if (refreshToken) {
        localStorage.setItem('gotrading_refresh_token', refreshToken);
      }

      setAccessToken(token);
      const decodedUser = user || parseJwt(token) || { id: '1', email: identifier, name: 'Admin', role: 'ADMIN' };
      setCurrentUser(decodedUser);
    } catch (err: any) {
      let msg = '';
      if (!err.response) {
        msg = 'Tidak dapat terhubung ke server backend, silakan periksa koneksi atau coba lagi nanti.';
      } else if (err.response.data?.error && typeof err.response.data.error === 'string') {
        msg = err.response.data.error;
      } else if (err.response.data?.message && typeof err.response.data.message === 'string') {
        msg = err.response.data.message;
      } else if (err.response.status === 401) {
        msg = 'Email atau password salah. Silakan periksa kembali kredensial Anda.';
      } else if (err.message && !err.message.includes('status code')) {
        msg = err.message;
      } else {
        msg = 'Autentikasi gagal. Silakan coba lagi.';
      }

      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gotrading_access_token');
    localStorage.removeItem('gotrading_refresh_token');
    setAccessToken(null);
    setCurrentUser(null);
    // Optional backend logout call
    httpClient.post('/api/auth/logout').catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        accessToken,
        isAuthenticated: !!accessToken && !!currentUser,
        isLoading,
        isLoggingIn,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
