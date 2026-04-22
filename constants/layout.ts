import { Platform } from 'react-native';

export const TAB_BAR = {
  bottomMargin: Platform.OS === 'android' ? 24 : 16,
  height: Platform.OS === 'android' ? 68 : 64,
  horizontalMargin: 20,
  borderRadius: 22,
} as const;

export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR.bottomMargin + TAB_BAR.height;
