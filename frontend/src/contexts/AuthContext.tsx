import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, AuthResponse } from '../services/authService';
import { connectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (name: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (name: string, email: string) => Promise<AuthResponse>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuctioneer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data.user);
          // Connect socket after user is loaded
          connectSocket();
        } else {
          // Invalid token, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await authService.login(email, password);
    if (response.success && response.data) {
      setUser(response.data.user);
      // Connect socket after login
      connectSocket();
    }
    return response;
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await authService.register(name, email, password);
    if (response.success && response.data) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (name: string, email: string): Promise<AuthResponse> => {
    const response = await authService.updateDetails(name, email);
    if (response.success && response.data) {
      setUser(response.data.user);
    }
    return response;
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> => {
    return await authService.updatePassword(currentPassword, newPassword);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    updatePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAuctioneer: user?.role === 'admin' || user?.role === 'auctioneer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
