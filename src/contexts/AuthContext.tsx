import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthState } from '@/services/auth';

interface AuthContextType extends AuthState {
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  convertToRegistered: (email: string, password: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAnonymous: false,
    userId: null,
    email: null,
    username: null,
  });

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const state = await authService.initializeAuth();
      setAuthState(state);
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  const signInAnonymously = async () => {
    try {
      const state = await authService.signInAnonymously();
      setAuthState(state);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOutUser();
      setAuthState({
        isAuthenticated: false,
        isAnonymous: false,
        userId: null,
        email: null,
        username: null,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const convertToRegistered = async (email: string, password: string) => {
    try {
      await authService.convertAnonymousToRegistered(email, password);
      await initAuth();
    } catch (error) {
      console.error('Error converting to registered user:', error);
      throw error;
    }
  };

  const refreshAuth = async () => {
    await initAuth();
  };

  const value: AuthContextType = {
    ...authState,
    signInAnonymously,
    signOut,
    convertToRegistered,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};