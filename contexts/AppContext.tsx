/**
 * App Context for managing global state (meals, settings, etc.)
 */

import React, { createContext, useContext, useReducer, useMemo, ReactNode, useEffect } from 'react';
import { AppState, AppAction, MealEntry, UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/mockData';
import * as StorageService from '@/services/storage-service';
import { generateUUID } from '@/services/device-id-service';
import { useAuth } from '@/contexts/AuthContext';

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
  clearMeals: () => void;
  getRemainingCalories: () => number;
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
      setError(null);

      try {
        // Load meals for today
        const meals = await StorageService.loadMeals(new Date());

        // Load settings
        const savedSettings = await StorageService.loadSettings();
        const settings = savedSettings || DEFAULT_SETTINGS;

        // Dispatch loaded data
        if (savedSettings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        }

        // Load meals one by one to trigger recalculation
        meals.forEach(meal => {
          dispatch({ type: 'ADD_MEAL', payload: meal });
        });

        setIsInitialized(true);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error loading initial data:', error);
        setError(error?.message || 'Failed to load data from cloud');
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user, authLoading]);

  // Clear data when user logs out
  useEffect(() => {
    if (!authLoading && !user && isInitialized) {
      // User logged out, clear all data
      dispatch({ type: 'CLEAR_MEALS' });
      dispatch({ type: 'UPDATE_SETTINGS', payload: DEFAULT_SETTINGS });
      setIsInitialized(false);
    }
  }, [user, authLoading, isInitialized]);

  // Save meals to Supabase whenever they change (debounced)
  useEffect(() => {
    if (isInitialized && user && state.meals.length >= 0) {
      StorageService.saveMeals(state.meals, new Date()).catch((error: any) => {
        console.error('Error saving meals:', error);
        setError(error?.message || 'Failed to save meals to cloud');
      });
    }
  }, [state.meals, isInitialized, user]);

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

  const clearMeals = () => {
    dispatch({ type: 'CLEAR_MEALS' });
  };

  const getRemainingCalories = () => {
    return state.settings.dailyCalorieGoal - state.totalCalories;
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      addMeal,
      updateMeal,
      deleteMeal,
      updateSettings,
      clearMeals,
      getRemainingCalories,
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
