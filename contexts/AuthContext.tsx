import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { AuthUser } from '../types';
import { authService } from '../services/auth-service';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        const { user: currentUser, error } = await authService.getCurrentUser();
        if (error) {
          console.error('Auth state change error:', error);
          // If profile is missing, getCurrentUser will try to create it
          // If it still fails, log the error but set user anyway for debugging
          if (error.code === 'PROFILE_MISSING') {
            console.error('Profile missing during auth state change');
          }
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const { user: currentUser, error } = await authService.getCurrentUser();

      if (error) {
        // "Auth session missing" is normal on first app launch - don't log as error
        const isNoSession = error.code === '400' || error.message?.includes('Auth session missing');

        if (!isNoSession) {
          // Only log actual errors (not the expected "no session" case)
          console.error('Failed to initialize auth:', error);
        }

        // Even if there's an error, we might have a user (with profile issues)
        // Set the user so the app can handle the error state appropriately
        setUser(currentUser);
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Exception during auth initialization:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await authService.signUp(email, password);

      // Only navigate if signup was successful AND no errors (including profile errors)
      if (result.user && !result.error) {
        setUser(result.user);
        // Navigate to main app after successful signup
        router.replace('/(tabs)');
      } else if (result.error) {
        // Handle errors - don't set user or navigate if signup failed
        console.error('Signup error:', result.error);
        if (result.user) {
          // User account created but has issues (like profile creation failure)
          setUser(result.user);
        }
      }

      // Convert AuthError object to string for interface consistency
      return {
        user: result.user,
        error: result.error ? result.error.message : null
      };
    } catch (error: any) {
      console.error('Signup exception:', error);
      return { user: null, error: error.message || 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authService.signIn(email, password);

      // Only navigate if login successful AND no errors
      if (result.user && !result.error) {
        setUser(result.user);
        // Navigate to main app after successful login
        router.replace('/(tabs)');
      } else if (result.error) {
        // Handle errors
        console.error('Sign in error:', result.error);
        if (result.user) {
          // User authenticated but has issues (like missing profile)
          setUser(result.user);
        }
      }

      // Convert AuthError object to string for interface consistency
      return {
        user: result.user,
        error: result.error ? result.error.message : null
      };
    } catch (error: any) {
      console.error('Sign in exception:', error);
      return { user: null, error: error.message || 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      // Navigate to login screen after logout
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
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
