/**
 * Typography System - Apple iOS style
 * Uses SF Pro (system default) for native feel
 */

export const TYPOGRAPHY = {
  // Display
  displayLarge: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },

  // Titles
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },

  // Body
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  // Labels
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },

  // Numeric displays (calories, macros)
  numericLarge: {
    fontSize: 48,
    fontWeight: '700' as const,
    lineHeight: 56,
  },
  numericMedium: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 38,
  },
  numericSmall: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};
