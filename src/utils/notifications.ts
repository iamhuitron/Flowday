/**
 * FlowDay — Notification Service
 * Maneja permisos, canales de Android, y scheduling de notificaciones
 * para actividades del horario, recordatorio de hábitos y resumen diario.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DayTemplate, AppSettings, DayOfWeek } from '../types/index';
import { timeToMinutes } from './index';

// ─── Prefijos de ID para poder cancelar por categoría ────────────────────────
const PREFIX_ACTIVITY = 'fd-act-';
const ID_HABIT_REMINDER = 'fd-habit-reminder';
const ID_DAILY_SUMMARY  = 'fd-daily-summary';

// ─── Weekday map: DayOfWeek → iOS/Android (1=Dom … 7=Sáb) ───────────────────
const DAY_WEEKDAY: Record<DayOfWeek, number> = {
  sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7,
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. SETUP: handler foreground + canal de Android
// ──────────────────────────────────────────────────────────────────────────────
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function createAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('flowday', {
    name: 'FlowDay',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#7c6aff',
    sound: 'default',
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. PERMISOS
// ──────────────────────────────────────────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. ACTIVIDADES — reagendar todo cuando cambian templates o settings
// ──────────────────────────────────────────────────────────────────────────────
export async function scheduleActivityNotifications(
  templates: DayTemplate[],
  enabled: boolean,
): Promise<void> {
  // Cancelar todas las notificaciones de actividad existentes
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.identifier.startsWith(PREFIX_ACTIVITY))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch { /* ignorar errores de cancelación */ }

  if (!enabled) return;

  let scheduled = 0;
  const MAX = 55; // reservar margen para hábitos y resumen (iOS límite = 64)

  for (const template of templates) {
    for (const activity of template.activities) {
      if (!activity.notifyBefore || activity.notifyBefore <= 0) continue;

      const actMins    = timeToMinutes(activity.startTime);
      const notifyMins = actMins - activity.notifyBefore;
      if (notifyMins < 0) continue; // evitar notificaciones cruzando medianoche

      const hour   = Math.floor(notifyMins / 60) % 24;
      const minute = notifyMins % 60;

      for (const day of template.days) {
        if (scheduled >= MAX) break;

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `${PREFIX_ACTIVITY}${activity.id}-${day}`,
            content: {
              title: `⏰ ${activity.name} en ${activity.notifyBefore} min`,
              body: activity.description
                ? `${activity.description} · Empieza a las ${activity.startTime}`
                : `Empieza a las ${activity.startTime}`,
              data: { activityId: activity.id, templateId: template.id },
              ...(Platform.OS === 'android' && { channelId: 'flowday' }),
            },
            trigger: {
              weekday: DAY_WEEKDAY[day],
              hour,
              minute,
              repeats: true,
            } as any,
          });
          scheduled++;
        } catch { /* ignorar actividades que no puedan programarse */ }
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. HÁBITOS — recordatorio diario a las 9:00 AM
// ──────────────────────────────────────────────────────────────────────────────
export async function scheduleHabitReminder(enabled: boolean): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_HABIT_REMINDER);
  } catch { /* no existía */ }

  if (!enabled) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_HABIT_REMINDER,
      content: {
        title: '🌟 Hábitos pendientes',
        body: 'Toma un momento para revisar tus hábitos de hoy',
        ...(Platform.OS === 'android' && { channelId: 'flowday' }),
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch { /* permisos no concedidos */ }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. RESUMEN DIARIO — cada noche a las 10:00 PM
// ──────────────────────────────────────────────────────────────────────────────
export async function scheduleDailySummary(enabled: boolean): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_DAILY_SUMMARY);
  } catch { /* no existía */ }

  if (!enabled) return;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_DAILY_SUMMARY,
      content: {
        title: '🎯 Resumen de FlowDay',
        body: '¿Cómo estuvo tu día? Revisa tu progreso de hábitos',
        ...(Platform.OS === 'android' && { channelId: 'flowday' }),
      },
      trigger: {
        hour: 22,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch { /* permisos no concedidos */ }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. CANCELAR TODO
// ──────────────────────────────────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. REAGENDAR COMPLETO — llamar cuando cambian templates o settings
// ──────────────────────────────────────────────────────────────────────────────
export async function rescheduleAll(
  templates: DayTemplate[],
  settings: AppSettings,
): Promise<void> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await scheduleHabitReminder(settings.notificationsEnabled);
  await scheduleDailySummary(settings.notificationsEnabled && (settings.notifySummary ?? true));
  await scheduleActivityNotifications(templates, settings.notificationsEnabled && (settings.notifyActivities ?? true));
}
