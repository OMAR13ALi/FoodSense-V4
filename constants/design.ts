/**
 * Design tokens — single source of truth for colors, spacing, radius, typography, shadows.
 *
 * Light Apple aesthetic with indigo accent. Hero numbers use the system serif
 * (New York on iOS, fallback serif on Android/web) to feel editorial and
 * distinctively native.
 */

import { Platform } from 'react-native';

// -----------------------------------------------------------------------------
// Color palette
// -----------------------------------------------------------------------------

const palette = {
  light: {
    bg: {
      canvas: '#F7F8FB',
      surface: '#FFFFFF',
      inset: '#EFF1F5',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    hairline: 'rgba(17, 24, 39, 0.08)',
    accent: '#2563EB',
    accentTint: '#EFF6FF',
    accentDeep: '#1D4ED8',
    macro: {
      protein: '#6366F1',
      carbs: '#F59E0B',
      fat: '#10B981',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    streakStart: '#FF9500',
    streakEnd: '#FF3B30',
    shadow: 'rgba(17, 24, 39, 0.08)',
    placeholder: '#9CA3AF',
  },
  dark: {
    bg: {
      canvas: '#0A0A0F',
      surface: '#1C1C1E',
      inset: '#1E293B',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
      inverse: '#111827',
    },
    hairline: 'rgba(255, 255, 255, 0.10)',
    accent: '#60A5FA',
    accentTint: '#1E293B',
    accentDeep: '#2563EB',
    macro: {
      protein: '#818CF8',
      carbs: '#FBBF24',
      fat: '#34D399',
    },
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    streakStart: '#FF9500',
    streakEnd: '#FF3B30',
    shadow: 'rgba(96, 165, 250, 0.16)',
    placeholder: '#6B7280',
  },
} as const;

export const designColors = palette;

// -----------------------------------------------------------------------------
// Spacing — 4 / 8 / 12 / 16 / 24 / 40
// -----------------------------------------------------------------------------

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 40,
} as const;

// -----------------------------------------------------------------------------
// Radius
// -----------------------------------------------------------------------------

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

// -----------------------------------------------------------------------------
// Typography — system sans for UI, system serif for hero numbers
// -----------------------------------------------------------------------------

const fontFamilies = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'New York', 'Charter', Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
})!;

export const fonts = fontFamilies;

export const typography = {
  hero: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: fontFamilies.serif,
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 17,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} as const;

// -----------------------------------------------------------------------------
// Shadows — layered, very soft
// -----------------------------------------------------------------------------

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  bar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// -----------------------------------------------------------------------------
// Layout constants
// -----------------------------------------------------------------------------

export const layout = {
  tabBarHeight: Platform.OS === 'ios' ? 64 : 68,
  calorieBarCollapsed: 64,
  calorieBarExpanded: 240,
  hairlineWidth: Platform.OS === 'ios' ? 0.5 : 1,
} as const;
