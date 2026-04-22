import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get Supabase credentials from environment
const getSupabaseUrl = (): string => {
  const url = Constants.expoConfig?.extra?.supabaseUrl;
  if (!url) {
    throw new Error(
      'Missing SUPABASE_URL environment variable. Please add it to your .env file and app.config.js'
    );
  }
  return url;
};

const getSupabaseAnonKey = (): string => {
  const key = Constants.expoConfig?.extra?.supabaseAnonKey;
  if (!key) {
    throw new Error(
      'Missing SUPABASE_ANON_KEY environment variable. Please add it to your .env file and app.config.js'
    );
  }
  return key;
};

// Initialize Supabase client
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed for React Native
  },
});

// Database types (will be auto-generated later with `supabase gen types typescript`)
export interface Database {
  public: {
    Tables: {
      meals: {
        Row: {
          id: string;
          device_id: string;
          user_id: string | null; // Added for auth support
          text: string;
          calories: number;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          timestamp: string; // ISO timestamp
          ai_explanation: string | null;
          confidence: number | null;
          sources: string[] | null; // JSONB array
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id?: string | null;
          text: string;
          calories: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          timestamp: string;
          ai_explanation?: string | null;
          confidence?: number | null;
          sources?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string | null;
          text?: string;
          calories?: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          timestamp?: string;
          ai_explanation?: string | null;
          confidence?: number | null;
          sources?: string[] | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          device_id: string;
          user_id: string | null; // Added for auth support
          daily_calorie_goal: number;
          target_protein: number;
          target_carbs: number;
          target_fat: number;
          meal_reminders: boolean;
          track_water: boolean;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          device_id: string;
          user_id?: string | null;
          daily_calorie_goal?: number;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
          meal_reminders?: boolean;
          track_water?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          device_id?: string;
          user_id?: string | null;
          daily_calorie_goal?: number;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
          meal_reminders?: boolean;
          track_water?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_summaries: {
        Row: {
          id: string;
          device_id: string;
          user_id: string | null; // Added for auth support
          date: string; // YYYY-MM-DD
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          meal_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id?: string | null;
          date: string;
          total_calories: number;
          total_protein: number;
          total_carbs: number;
          total_fat: number;
          meal_count: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string | null;
          date?: string;
          total_calories?: number;
          total_protein?: number;
          total_carbs?: number;
          total_fat?: number;
          meal_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          height_cm: number | null;
          weight_kg: number | null;
          age: number | null;
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          dietary_preference: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
          allergies: string[] | null;
          daily_calorie_goal: number;
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
          target_protein: number;
          target_carbs: number;
          target_fat: number;
          theme: 'light' | 'dark' | 'auto';
          meal_reminders: boolean;
          track_water: boolean;
          data_sharing_consent: boolean;
          analytics_enabled: boolean;
          device_id: string | null;
          migrated_at: string | null;
          created_at: string;
          updated_at: string;
          last_active: string | null;
        };
        Insert: {
          id: string;
          email: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
          allergies?: string[] | null;
          daily_calorie_goal?: number;
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
          theme?: 'light' | 'dark' | 'auto';
          meal_reminders?: boolean;
          track_water?: boolean;
          data_sharing_consent?: boolean;
          analytics_enabled?: boolean;
          device_id?: string | null;
          migrated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          height_cm?: number | null;
          weight_kg?: number | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
          allergies?: string[] | null;
          daily_calorie_goal?: number;
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
          target_protein?: number;
          target_carbs?: number;
          target_fat?: number;
          theme?: 'light' | 'dark' | 'auto';
          meal_reminders?: boolean;
          track_water?: boolean;
          data_sharing_consent?: boolean;
          analytics_enabled?: boolean;
          device_id?: string | null;
          migrated_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active?: string | null;
        };
      };
      favorite_meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          emoji: string | null;
          notes: string | null;
          frequency_count: number;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          emoji?: string | null;
          notes?: string | null;
          frequency_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          calories?: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          emoji?: string | null;
          notes?: string | null;
          frequency_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          logged_at: string; // YYYY-MM-DD
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_kg: number;
          logged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight_kg?: number;
          logged_at?: string;
          created_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
      };
    };
  };
}
