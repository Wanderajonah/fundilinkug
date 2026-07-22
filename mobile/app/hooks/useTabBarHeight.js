import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Icon row + label row inside the tab bar (excluding device safe area). */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 8);
}
