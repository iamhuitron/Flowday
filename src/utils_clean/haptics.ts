/**
 * FlowDay — Haptic Feedback Service
 * Wrapper ligero sobre expo-haptics con fallback silencioso en web/error.
 *
 * Uso:
 *   import { haptic } from '@utils/haptics';
 *   haptic.success();   // al completar un hábito
 *   haptic.medium();    // al marcar una tarea
 *   haptic.selection(); // al cambiar de tab o seleccionar opción
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS !== 'web';

const safe = (fn: () => Promise<void>) => {
  if (isNative) fn().catch(() => {});
};

export const haptic = {
  /** Toque suave — navegación, selección de color/tab */
  selection: () => safe(() => Haptics.selectionAsync()),

  /** Impacto ligero — apertura de modales, toggles menores */
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** Impacto medio — marcar tarea, botones de acción */
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** Impacto fuerte — long press, confirmación de borrado */
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  /** Éxito — completar hábito, guardar con éxito, onboarding completo */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  /** Advertencia — acción destructiva activada */
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  /** Error — validación fallida, importación corrupta */
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
