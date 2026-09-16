import { Platform } from 'react-native';
import { Activity, Habit, HabitLog, DayTemplate } from '../types/index';
import { timeToMinutes, minutesToTime, formatDuration } from './index';

export interface WidgetTodayData {
  name: string;
  timeRange: string;
  duration: string;
  category: string;
  next: string;
  progressPct: number;
}

export interface WidgetHabitsData {
  streak: number;
  done: number;
  total: number;
  ratioPct: number;
}

export interface WidgetSnapshot {
  today: WidgetTodayData;
  habits: WidgetHabitsData;
  lastUpdated: string;
}

function getNowMins(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

/**
 * Computes the snapshot of what should appear on the widgets
 */
export function computeWidgetSnapshot(
  todayTemplate: DayTemplate | undefined,
  habits: Habit[],
  habitLogs: HabitLog[],
  streak: number
): WidgetSnapshot {
  const nowMins = getNowMins();
  const todayKey = new Date().toISOString().slice(0, 10);

  // 1. Current & Next Activity
  let currentActivity: Activity | undefined;
  let nextActivity: Activity | undefined;

  if (todayTemplate && todayTemplate.activities.length > 0) {
    const sorted = [...todayTemplate.activities].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 0; i < sorted.length; i++) {
      const act = sorted[i];
      const startM = timeToMinutes(act.startTime);
      const endM = startM + act.duration;

      if (nowMins >= startM && nowMins < endM) {
        currentActivity = act;
        nextActivity = sorted[i + 1];
        break;
      } else if (nowMins < startM) {
        if (!nextActivity) {
          nextActivity = act;
        }
      }
    }
  }

  let todayData: WidgetTodayData;
  if (currentActivity) {
    const startM = timeToMinutes(currentActivity.startTime);
    const endM = startM + currentActivity.duration;
    const progress = Math.min(
      Math.max(Math.round(((nowMins - startM) / currentActivity.duration) * 100), 0),
      100
    );

    todayData = {
      name: currentActivity.name,
      timeRange: `${currentActivity.startTime} - ${minutesToTime(endM)}`,
      duration: formatDuration(currentActivity.duration),
      category: currentActivity.category,
      next: nextActivity ? `Siguiente: ${nextActivity.name} · ${nextActivity.startTime}` : 'Día completado',
      progressPct: progress,
    };
  } else if (nextActivity) {
    todayData = {
      name: 'Pausa / Tiempo Libre',
      timeRange: `Hasta las ${nextActivity.startTime}`,
      duration: formatDuration(timeToMinutes(nextActivity.startTime) - nowMins),
      category: 'break',
      next: `Próximo: ${nextActivity.name} (${nextActivity.startTime})`,
      progressPct: 0,
    };
  } else {
    todayData = {
      name: 'Sin actividades en curso',
      timeRange: 'Horario libre',
      duration: '0m',
      category: 'custom',
      next: 'Planifica tu día en FlowDay',
      progressPct: 0,
    };
  }

  // 2. Habits
  const todayDone = habits.filter((h) =>
    habitLogs.some((l) => l.habitId === h.id && l.date === todayKey && l.done)
  ).length;
  const totalHabits = habits.length;
  const ratioPct = totalHabits > 0 ? Math.round((todayDone / totalHabits) * 100) : 0;

  const habitsData: WidgetHabitsData = {
    streak,
    done: todayDone,
    total: totalHabits,
    ratioPct,
  };

  return {
    today: todayData,
    habits: habitsData,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Synchronizes the computed snapshot to native storage
 */
export function syncWidgetData(
  todayTemplate: DayTemplate | undefined,
  habits: Habit[],
  habitLogs: HabitLog[],
  streak: number
): WidgetSnapshot {
  const snapshot = computeWidgetSnapshot(todayTemplate, habits, habitLogs, streak);

  try {
    if (Platform.OS !== 'web') {
      // If MMKV is available, store it for the native widget layer
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MMKV } = require('react-native-mmkv');
      const mmkv = new MMKV({ id: 'flowday-widgets' });
      mmkv.set('widget_snapshot', JSON.stringify(snapshot));
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('flowday_widget_snapshot', JSON.stringify(snapshot));
      }
    }
  } catch (e) {
    // Non-fatal
  }

  return snapshot;
}
