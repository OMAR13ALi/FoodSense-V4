/**
 * Backwards-compatible theme exports. New code should import from `@/constants/design`.
 */

import { designColors, fonts } from './design';

const tintColorLight = designColors.light.accent;
const tintColorDark = designColors.dark.accent;

export const Colors = {
  light: {
    text: designColors.light.text.primary,
    background: designColors.light.bg.canvas,
    tint: tintColorLight,
    icon: designColors.light.text.secondary,
    tabIconDefault: designColors.light.text.tertiary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: designColors.dark.text.primary,
    background: designColors.dark.bg.canvas,
    tint: tintColorDark,
    icon: designColors.dark.text.secondary,
    tabIconDefault: designColors.dark.text.tertiary,
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = fonts;
