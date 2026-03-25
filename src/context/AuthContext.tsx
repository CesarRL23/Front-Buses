import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthContextType,
  User,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth.types';
import { authService } from '../services/authService';
import { isTokenExpired, decodeJwt } from '../utils/fakeJwt';

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pending2faEmail, setPending2faEmail] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedPendingEmail = localStorage.getItem('pending_2fa_email');

      if (storedToken && storedUser && !isTokenExpired(storedToken) && decodeJwt(storedToken)) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        try {
          // ⚠️ IMPORTANT: Automatically refresh user roles from backend
          const refreshedUser = await authService.getCurrentUser(storedToken);
          // Only update if something changed
          if (JSON.stringify(parsedUser.roles) !== JSON.stringify(refreshedUser.roles)) {
            setUser(refreshedUser);
            localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
          }
        } catch (error) {
          console.warn("No se pudo refrescar roles en segundo plano:", error);
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }

      if (storedPendingEmail) {
        setPending2faEmail(storedPendingEmail);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Check token validity periodically, on window focus, and on storage changes
  useEffect(() => {
    const checkToken = () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken && (isTokenExpired(storedToken) || !decodeJwt(storedToken))) {
        logout();
      } else if (!storedToken && token) {
        // Token was removed from localStorage
        logout();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkToken, 30000);

    // Check on window focus
    const handleFocus = () => checkToken();
    window.addEventListener('focus', handleFocus);

    // Check when localStorage is modified (including from developer tools)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          // Token was deleted
          logout();
        } else if (e.newValue !== token) {
          // Token was modified
          const newToken = e.newValue;
          if (isTokenExpired(newToken) || !decodeJwt(newToken)) {
            logout();
          } else {
            // Valid token, update state
            setToken(newToken);
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await authService.login(credentials);
      if (response.status === '2fa_required') {
        setPending2faEmail(response.email || credentials.email);
        localStorage.setItem('pending_2fa_email', response.email || credentials.email);
        return;
      }
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    credentials: RegisterCredentials
  ): Promise<void> => {
    try {
      const response = await authService.register(credentials);
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const oauthLogin = async (tokenPayload: string): Promise<void> => {
    try {
      const response = await authService.exchangeOAuthToken(tokenPayload);
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const response = await authService.loginWithGoogle();
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithMicrosoft = async (): Promise<void> => {
    try {
      const response = await authService.loginWithMicrosoft();
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithGithub = async (): Promise<void> => {
    try {
      const response = await authService.loginWithGithub();
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('temp_token');
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      const updatedUser = await authService.updateProfile(user.id, userData);
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      throw error;
    }
  };

  const verifyTwoFactor = async (code: string): Promise<void> => {
    if (!pending2faEmail) throw new Error('No hay verificación 2FA pendiente');
    try {
      const response = await authService.verify2fa(pending2faEmail, code);
      if (response.user && response.token) {
        setPending2faEmail(null);
        localStorage.removeItem('pending_2fa_email');
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    verifyTwoFactor,
    forgotPassword,
    oauthLogin,
    startOAuth: authService.startOAuth,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithGithub,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
