/**
 * Authentication Service
 * Handles all authentication operations using Supabase Auth
 */

import { supabase } from './supabase-client';
import type { AuthUser, AuthError } from '../types';

export class AuthService {
  /**
   * SAFETY NET: Ensure user profile exists in user_profiles table
   * If profile doesn't exist, create it automatically
   * This is a fallback in case the database trigger fails
   */
  private static async ensureUserProfile(userId: string, email: string): Promise<{
    profileExists: boolean;
    profileCreated: boolean;
    error: AuthError | null;
  }> {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking profile existence:', fetchError);
        return {
          profileExists: false,
          profileCreated: false,
          error: {
            message: `Failed to check profile: ${fetchError.message}`,
            code: fetchError.code,
          },
        };
      }

      // Profile exists, all good!
      if (existingProfile) {
        return {
          profileExists: true,
          profileCreated: false,
          error: null,
        };
      }

      // Profile doesn't exist - create it as fallback
      console.warn(`Profile missing for user ${userId}, creating fallback profile...`);

      const { error: insertError } = await supabase.from('user_profiles').insert({
        id: userId,
        email: email,
        daily_calorie_goal: 2000,
        activity_level: 'moderate',
        target_protein: 150,
        target_carbs: 250,
        target_fat: 65,
        theme: 'auto',
        meal_reminders: false,
        track_water: false,
        data_sharing_consent: false,
        analytics_enabled: true,
      });

      if (insertError) {
        console.error('Failed to create fallback profile:', insertError);
        return {
          profileExists: false,
          profileCreated: false,
          error: {
            message: `Failed to create profile: ${insertError.message}`,
            code: insertError.code,
          },
        };
      }

      console.log(`✓ Fallback profile created successfully for user ${userId}`);
      return {
        profileExists: true,
        profileCreated: true,
        error: null,
      };
    } catch (err: any) {
      console.error('Unexpected error in ensureUserProfile:', err);
      return {
        profileExists: false,
        profileCreated: false,
        error: {
          message: err.message || 'Failed to ensure user profile',
          code: 'EXCEPTION',
        },
      };
    }
  }
  /**
   * Sign up a new user with email and password
   */
  static async signUp(email: string, password: string): Promise<{
    user: AuthUser | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // No email verification required
        },
      });

      if (error) {
        return {
          user: null,
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      if (!data.user) {
        return {
          user: null,
          error: {
            message: 'Failed to create user account',
            code: 'SIGNUP_FAILED',
          },
        };
      }

      // Map Supabase user to our AuthUser type
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };

      // CRITICAL: Ensure profile was created (safety net for trigger failure)
      // Give the trigger a moment to execute, then verify
      await new Promise(resolve => setTimeout(resolve, 500));

      const profileCheck = await this.ensureUserProfile(data.user.id, data.user.email!);

      if (!profileCheck.profileExists) {
        console.error('Profile creation failed even with fallback:', profileCheck.error);
        // Return warning but don't block signup
        return {
          user,
          error: {
            message: 'Account created but profile setup incomplete. Please try logging in again.',
            code: 'PROFILE_CREATION_FAILED',
          },
        };
      }

      if (profileCheck.profileCreated) {
        console.warn('Profile was created by fallback mechanism (trigger may have failed)');
      }

      return { user, error: null };
    } catch (err: any) {
      return {
        user: null,
        error: {
          message: err.message || 'An unexpected error occurred during signup',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  static async signIn(email: string, password: string): Promise<{
    user: AuthUser | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      if (!data.user) {
        return {
          user: null,
          error: {
            message: 'Failed to sign in',
            code: 'SIGNIN_FAILED',
          },
        };
      }

      // Map Supabase user to our AuthUser type
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };

      // SAFETY NET: Ensure profile exists (for existing users without profiles)
      const profileCheck = await this.ensureUserProfile(data.user.id, data.user.email!);

      if (!profileCheck.profileExists) {
        console.error('Profile missing for existing user and fallback failed');
        return {
          user,
          error: {
            message: 'Profile data missing. Please contact support or try signing up again.',
            code: 'PROFILE_MISSING',
          },
        };
      }

      if (profileCheck.profileCreated) {
        console.log('Created missing profile for existing user during sign in');
      }

      return { user, error: null };
    } catch (err: any) {
      return {
        user: null,
        error: {
          message: err.message || 'An unexpected error occurred during sign in',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      return { error: null };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'An unexpected error occurred during sign out',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Get the currently authenticated user
   */
  static async getCurrentUser(): Promise<{
    user: AuthUser | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return {
          user: null,
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      if (!data.user) {
        return { user: null, error: null };
      }

      // Map Supabase user to our AuthUser type
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };

      // SAFETY NET: Ensure profile exists (critical for app functionality)
      const profileCheck = await this.ensureUserProfile(data.user.id, data.user.email!);

      if (!profileCheck.profileExists) {
        console.error('Profile missing for current user');
        return {
          user,
          error: {
            message: 'Profile data missing. Please try logging out and back in.',
            code: 'PROFILE_MISSING',
          },
        };
      }

      if (profileCheck.profileCreated) {
        console.log('Created missing profile for current user');
      }

      return { user, error: null };
    } catch (err: any) {
      return {
        user: null,
        error: {
          message: err.message || 'An unexpected error occurred',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Get the current session
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          session: null,
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      return { session: data.session, error: null };
    } catch (err: any) {
      return {
        session: null,
        error: {
          message: err.message || 'An unexpected error occurred',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined, // Will handle password reset in-app
      });

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      return { error: null };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'An unexpected error occurred during password reset',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Update the current user's password
   */
  static async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      return { error: null };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'An unexpected error occurred during password update',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Update the current user's email
   */
  static async updateEmail(newEmail: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        return {
          error: {
            message: error.message,
            code: error.status?.toString(),
            status: error.status,
          },
        };
      }

      return { error: null };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'An unexpected error occurred during email update',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Delete the current user's account
   */
  static async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      // Note: Supabase doesn't have a built-in deleteUser method for clients
      // This would need to be implemented via an edge function or RPC call
      // For now, we'll return an error indicating this needs backend support
      return {
        error: {
          message: 'Account deletion requires backend implementation',
          code: 'NOT_IMPLEMENTED',
        },
      };
    } catch (err: any) {
      return {
        error: {
          message: err.message || 'An unexpected error occurred',
          code: 'EXCEPTION',
        },
      };
    }
  }

  /**
   * Listen to auth state changes
   * Returns Supabase auth listener object with subscription
   */
  static onAuthStateChange(
    callback: (event: string, session: any) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance (class with static methods)
export const authService = AuthService;
