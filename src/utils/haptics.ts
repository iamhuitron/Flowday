import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS !== 'web';

const safe = (fn: () => Promise<void>) => {
  if (isNative) fn().catch(() => {});
};

type HapticType = 'selection' | 'light' | 'medium' | 'heavy' | 'impact' | 'success' | 'warning' | 'error';

function trigger(type: HapticType = 'medium') {
  switch (type) {
    case 'selection':
      return safe(() => Haptics.selectionAsync());
    case 'light':
      return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    case 'medium':
    case 'impact':
      return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    case 'heavy':
      return safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    case 'success':
      return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    case 'warning':
      return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
    case 'error':
      return safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }
}

export const haptic = Object.assign(trigger, {
  selection: () => trigger('selection'),
  light: () => trigger('light'),
  medium: () => trigger('medium'),
  heavy: () => trigger('heavy'),
  impact: () => trigger('medium'),
  success: () => trigger('success'),
  warning: () => trigger('warning'),
  error: () => trigger('error'),
});
