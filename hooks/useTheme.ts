/**
 * Custom Theme Hook
 * Combines user's dark mode preference with system color scheme
 * User preference (from settings) overrides system setting
 */

import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useApp } from '@/contexts/AppContext';

export function useTheme(): 'light' | 'dark' {
  const systemColorScheme = useSystemColorScheme();
  const { state } = useApp();

  // Check if user has explicitly set a dark mode preference
  const userDarkMode = state.settings.darkMode;

  // If user has set a preference (true or false), use it
  // Otherwise, fall back to system color scheme
  if (userDarkMode === true) {
    return 'dark';
  } else if (userDarkMode === false) {
    return 'light';
  } else {
    // User hasn't set a preference, use system
    return systemColorScheme ?? 'light';
  }
}
