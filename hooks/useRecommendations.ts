import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateTodaysRecommendation,
  getTodaysRecommendation,
} from '@/services/recommendation-service';
import { getUserProfile } from '@/services/profile-service';
import { formatDateKey } from '@/services/storage-service';
import { DailyRecommendation } from '@/types';

export interface UseRecommendationsResult {
  recommendation: DailyRecommendation | null;
  loading: boolean;
  error: string | null;
  hasGoal: boolean;
  refresh: () => Promise<void>;
}

/**
 * Loads today's cached recommendation; if none exists and the user has a goal,
 * triggers generation via the edge function. Caches in `daily_recommendations`.
 */
export function useRecommendations(): UseRecommendationsResult {
  const { user } = useAuth();
  const { state } = useApp();

  const [recommendation, setRecommendation] = useState<DailyRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGoal, setHasGoal] = useState(true);

  // Prevents re-entry while an in-flight generation is running.
  const generatingRef = useRef(false);
  // Tracks which "user + date" we've already resolved, so tab-focus re-renders
  // don't kick off a second AI call.
  const resolvedForRef = useRef<string | null>(null);

  const load = useCallback(async (force: boolean = false) => {
    if (!user) return;
    const today = formatDateKey(new Date());
    const key = `${user.id}:${today}`;
    if (!force && resolvedForRef.current === key) return;
    if (generatingRef.current) return;

    generatingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Cache hit?
      let rec = await getTodaysRecommendation();

      if (!rec || force) {
        const profile = await getUserProfile();
        if (!profile?.goal_type) {
          setHasGoal(false);
          setRecommendation(null);
          resolvedForRef.current = key;
          return;
        }
        setHasGoal(true);
        rec = await generateTodaysRecommendation(state.meals);
      } else {
        setHasGoal(true);
      }

      setRecommendation(rec);
      resolvedForRef.current = key;
    } catch (err: any) {
      console.warn('[useRecommendations] failed:', err?.message ?? err);
      setError(err?.message ?? 'Failed to load recommendations');
    } finally {
      generatingRef.current = false;
      setLoading(false);
    }
  }, [user, state.meals]);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    resolvedForRef.current = null;
    await load(true);
  }, [load]);

  return { recommendation, loading, error, hasGoal, refresh };
}
