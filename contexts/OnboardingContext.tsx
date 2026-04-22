import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GoalType } from '@/types';

export interface OnboardingDraft {
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  goal_type?: GoalType;
  target_weight_kg?: number;
  pace_kg_per_week?: number;
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  daily_calorie_goal?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fat?: number;
}

interface OnboardingContextValue {
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  resetDraft: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>({});

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetDraft = useCallback(() => setDraft({}), []);

  return (
    <OnboardingContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  }
  return ctx;
}
