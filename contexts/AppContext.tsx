/**
 * App Context for managing global state (meals, settings, etc.)
 */

import React, { createContext, useContext, useReducer, useMemo, ReactNode, useEffect } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AppState, AppAction, MealEntry, UserSettings, FavoriteMeal, AnimationSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/mockData';
import * as StorageService from '@/services/storage-service';
import * as FavoritesService from '@/services/favorites-service';
import * as AnimationSettingsService from '@/services/animation-settings-service';
import { saveMealsImmediate } from '@/services/database-service';
import { generateUUID } from '@/services/device-id-service';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Helper to safely save meals with auth check
 * Prevents errors when saving during logout or when user is not authenticated
 */
const trySaveMeals = async (meals: MealEntry[], user: any): Promise<void> => {
  // Skip if no user or no data
  if (!user || meals.length === 0) {
    return;
  }

  try {
    await saveMealsImmediate(meals, new Date());
  } catch (error: any) {
    // Only suppress expected auth errors during logout
    const isAuthError = error?.message?.includes('authenticated') ||
                       error?.message?.includes('Authentication') ||
                       error?.message?.includes('row-level security');

    if (!isAuthError) {
      // This is a real error - still log and throw it
      console.error('Unexpected error saving meals:', error);
      throw error;
    }
    // Auth errors during logout are expected - silently ignore
    // (User is already logged out, no point in saving)
  }
};

// Calculate totals from meals
const calculateTotals = (meals: MealEntry[]) => {
  return meals.reduce(
    (acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.isLoading ? 0 : meal.calories),
      totalProtein: acc.totalProtein + (meal.isLoading ? 0 : (meal.protein || 0)),
      totalCarbs: acc.totalCarbs + (meal.isLoading ? 0 : (meal.carbs || 0)),
      totalFat: acc.totalFat + (meal.isLoading ? 0 : (meal.fat || 0)),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );
};

// Initial state (will be loaded from storage)
const initialState: AppState = {
  meals: [],
  settings: DEFAULT_SETTINGS,
  favorites: [],
  animationSettings: AnimationSettingsService.DEFAULT_ANIMATION_SETTINGS,
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_MEAL': {
      const newMeals = [...state.meals, action.payload];
      return {
        ...state,
        meals: newMeals,
        ...calculateTotals(newMeals),
      };
    }

    case 'SET_MEALS': {
      return {
        ...state,
        meals: action.payload,
        ...calculateTotals(action.payload),
      };
    }

    case 'UPDATE_MEAL': {
      const updatedMeals = state.meals.map((meal) =>
        meal.id === action.payload.id ? { ...meal, ...action.payload.updates } : meal
      );
      return {
        ...state,
        meals: updatedMeals,
        ...calculateTotals(updatedMeals),
      };
    }

    case 'DELETE_MEAL': {
      const filteredMeals = state.meals.filter((meal) => meal.id !== action.payload);
      return {
        ...state,
        meals: filteredMeals,
        ...calculateTotals(filteredMeals),
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }

    case 'UPDATE_ANIMATION_SETTINGS': {
      return {
        ...state,
        animationSettings: { ...state.animationSettings, ...action.payload },
      };
    }

    case 'CLEAR_MEALS': {
      return {
        ...state,
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };
    }

    case 'SET_LOADING': {
      const updatedMeals = state.meals.map((meal) =>
        meal.id === action.payload.id ? { ...meal, isLoading: action.payload.isLoading } : meal
      );
      return {
        ...state,
        meals: updatedMeals,
      };
    }

    case 'SET_FAVORITES': {
      return {
        ...state,
        favorites: action.payload,
      };
    }

    case 'ADD_FAVORITE': {
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };
    }

    case 'UPDATE_FAVORITE': {
      const updatedFavorites = state.favorites.map((fav) =>
        fav.id === action.payload.id ? { ...fav, ...action.payload.updates } : fav
      );
      return {
        ...state,
        favorites: updatedFavorites,
      };
    }

    case 'DELETE_FAVORITE': {
      const filteredFavorites = state.favorites.filter((fav) => fav.id !== action.payload);
      return {
        ...state,
        favorites: filteredFavorites,
      };
    }

    default:
      return state;
  }
};

// Context type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addMeal: (meal: Omit<MealEntry, 'id' | 'timestamp'>) => string;
  updateMeal: (id: string, updates: Partial<MealEntry>) => void;
  deleteMeal: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateAnimationSettings: (settings: Partial<AnimationSettings>) => void;
  clearMeals: () => void;
  getRemainingCalories: () => number;
  // Favorite meals functions
  addFavorite: (favorite: Omit<FavoriteMeal, 'id' | 'user_id' | 'frequency_count' | 'created_at' | 'updated_at' | 'last_used_at'>) => Promise<void>;
  deleteFavoriteById: (id: string) => Promise<void>;
  addMealFromFavorite: (favoriteId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingInitialData, setIsLoadingInitialData] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    const loadInitialData = async () => {
      // Skip if auth is still loading
      if (authLoading) {
        return;
      }

      // Skip if user is not authenticated
      if (!user) {
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsLoadingInitialData(true);
      setError(null);

      try {
        // Load meals for today
        const meals = await StorageService.loadMeals(new Date());

        // Load settings
        const savedSettings = await StorageService.loadSettings();
        const settings = savedSettings || DEFAULT_SETTINGS;

        // Load animation settings
        const animationSettings = await AnimationSettingsService.loadAnimationSettings();

        // Load favorites
        const favorites = await FavoritesService.getFavorites();

        // Dispatch loaded data
        if (savedSettings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        }
        // Always dispatch animation settings (with defaults if needed)
        dispatch({ type: 'UPDATE_ANIMATION_SETTINGS', payload: animationSettings });

        // Load all meals at once (batch dispatch to prevent multiple re-renders)
        if (meals.length > 0) {
          dispatch({ type: 'SET_MEALS', payload: meals });
        }

        // Load favorites
        dispatch({ type: 'SET_FAVORITES', payload: favorites });

        setIsInitialized(true);
        setIsLoading(false);
        setIsLoadingInitialData(false);
      } catch (error: any) {
        console.error('Error loading initial data:', error);
        setError(error?.message || 'Failed to load data from cloud');
        setIsInitialized(true);
        setIsLoading(false);
        setIsLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [user, authLoading]);

  // Clear data when user logs out (with safe save first)
  useEffect(() => {
    if (!authLoading && !user && isInitialized) {
      // Try to save meals before clearing (will gracefully handle if already logged out)
      const handleLogout = async () => {
        // Use safe save helper - won't throw if user is already gone
        await trySaveMeals(state.meals, user);

        // Clear all data
        dispatch({ type: 'CLEAR_MEALS' });
        dispatch({ type: 'UPDATE_SETTINGS', payload: DEFAULT_SETTINGS });
        setIsInitialized(false);
      };

      handleLogout();
    }
  }, [user, authLoading, isInitialized, state.meals]);

  // Save meals to Supabase whenever they change (debounced with 500ms delay)
  useEffect(() => {
    // Skip save if still loading initial data or user not authenticated
    if (!isInitialized || !user || isLoadingInitialData) {
      return;
    }

    // Debounce the save to prevent multiple rapid saves
    const timeout = setTimeout(() => {
      StorageService.saveMeals(state.meals, new Date()).catch((error: any) => {
        console.error('Error saving meals:', error);
        setError(error?.message || 'Failed to save meals to cloud');
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [state.meals, isInitialized, user, isLoadingInitialData]);

  // Force save when app goes to background to prevent data loss
  useEffect(() => {
    if (!user || !isInitialized) {
      return;
    }

    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && state.meals.length > 0) {
        // Force immediate save when app goes to background (safe version)
        trySaveMeals(state.meals, user).catch((error) => {
          // Only real errors will reach here (auth errors are suppressed)
          console.error('Unexpected error saving meals on app background:', error);
        });
      }
    });

    return () => subscription.remove();
  }, [state.meals, user, isInitialized]);

  // Save settings to Supabase whenever they change (debounced)
  useEffect(() => {
    if (isInitialized && user) {
      StorageService.saveSettings(state.settings).catch((error: any) => {
        console.error('Error saving settings:', error);
        setError(error?.message || 'Failed to save settings to cloud');
      });
    }
  }, [state.settings, isInitialized, user]);

  // Helper functions
  const addMeal = (meal: Omit<MealEntry, 'id' | 'timestamp'>) => {
    const newMeal: MealEntry = {
      ...meal,
      id: generateUUID(),
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MEAL', payload: newMeal });
    return newMeal.id;
  };

  const updateMeal = (id: string, updates: Partial<MealEntry>) => {
    dispatch({ type: 'UPDATE_MEAL', payload: { id, updates } });
  };

  const deleteMeal = (id: string) => {
    dispatch({ type: 'DELETE_MEAL', payload: id });
  };

  const updateSettings = (settings: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const updateAnimationSettings = (settings: Partial<AnimationSettings>) => {
    dispatch({ type: 'UPDATE_ANIMATION_SETTINGS', payload: settings });
    // Save to storage
    const newSettings = { ...state.animationSettings, ...settings };
    AnimationSettingsService.saveAnimationSettings(newSettings).catch(err => {
      console.error('Failed to save animation settings:', err);
    });
  };

  const clearMeals = () => {
    dispatch({ type: 'CLEAR_MEALS' });
  };

  const getRemainingCalories = () => {
    return state.settings.dailyCalorieGoal - state.totalCalories;
  };

  const clearError = () => {
    setError(null);
  };

  // Favorite meals helper functions
  const addFavorite = async (favorite: Omit<FavoriteMeal, 'id' | 'user_id' | 'frequency_count' | 'created_at' | 'updated_at' | 'last_used_at'>) => {
    try {
      const newFavorite = await FavoritesService.addFavorite(favorite);
      dispatch({ type: 'ADD_FAVORITE', payload: newFavorite });
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      setError(error?.message || 'Failed to add favorite');
      throw error;
    }
  };

  const deleteFavoriteById = async (id: string) => {
    try {
      await FavoritesService.deleteFavorite(id);
      dispatch({ type: 'DELETE_FAVORITE', payload: id });
    } catch (error: any) {
      console.error('Error deleting favorite:', error);
      setError(error?.message || 'Failed to delete favorite');
      throw error;
    }
  };

  const addMealFromFavorite = async (favoriteId: string) => {
    try {
      const favorite = state.favorites.find(f => f.id === favoriteId);
      if (!favorite) {
        throw new Error('Favorite not found');
      }

      // Add meal from favorite
      addMeal({
        text: favorite.name,
        calories: favorite.calories,
        protein: favorite.protein,
        carbs: favorite.carbs,
        fat: favorite.fat,
      });

      // Increment usage count
      await FavoritesService.incrementFavoriteUsage(favoriteId);

      // Refresh favorites to get updated counts
      await refreshFavorites();
    } catch (error: any) {
      console.error('Error adding meal from favorite:', error);
      setError(error?.message || 'Failed to add meal from favorite');
      throw error;
    }
  };

  const refreshFavorites = async () => {
    try {
      const favorites = await FavoritesService.getFavorites();
      dispatch({ type: 'SET_FAVORITES', payload: favorites });
    } catch (error: any) {
      console.error('Error refreshing favorites:', error);
      setError(error?.message || 'Failed to refresh favorites');
      throw error;
    }
  };

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      addMeal,
      updateMeal,
      deleteMeal,
      updateSettings,
      updateAnimationSettings,
      clearMeals,
      getRemainingCalories,
      addFavorite,
      deleteFavoriteById,
      addMealFromFavorite,
      refreshFavorites,
      isLoading,
      error,
      clearError,
    }),
    [state, isLoading, error]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
