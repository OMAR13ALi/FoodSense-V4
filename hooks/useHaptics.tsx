/**
 * Haptics Hook - Provides intensity-aware haptic feedback
 * Respects user's animation settings for haptic feedback
 */

import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';

export function useHaptics() {
  const { state } = useApp();

  const trigger = (type: 'light' | 'medium' | 'heavy' | 'notification') => {
    // Skip if haptics are disabled
    if (!state.animationSettings.haptics) {
      return;
    }

    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'notification':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (error) {
      // Silently fail on platforms that don't support haptics
      console.log('[useHaptics] Haptic feedback not available:', error);
    }
  };

  return { trigger };
}
