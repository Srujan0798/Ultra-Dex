'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('ultra-dex-token');
    if (token) {
      // Mock user - replace with API call
      setUser({
        id: '1',
        email: 'user@example.com',
        name: 'Demo User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Mock login - replace with API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    localStorage.setItem('ultra-dex-token', 'mock-token');
    setUser({
      id: '1',
      email,
      name: 'Demo User',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('ultra-dex-token');
    setUser(null);
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    localStorage.setItem('ultra-dex-token', 'mock-token');
    setUser({
      id: '1',
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
