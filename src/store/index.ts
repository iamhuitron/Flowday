import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import {
  AppState, DayTemplate, Habit, HabitLog,
  Task, JournalEntry, AppSettings,
} from '@types/index';
import {
  DEFAULT_SETTINGS, DEFAULT_TEMPLATES, DEFAULT_HABITS,
} from '@constants/index';

// ─── MMKV storage adapter for Zustand ───────────────────────────────────────
const storage = new MMKV({ id: 'flowday-store' });

const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

// ─── Store actions ───────────────────────────────────────────────────────────
interface StoreActions {
  // Templates
  addTemplate: (t: DayTemplate) => void;
  updateTemplate: (t: DayTemplate) => void;
  deleteTemplate: (id: string) => void;

  // Habits
  addHabit: (h: Habit) => void;
  updateHabit: (h: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: string) => void;

  // Tasks
  addTask: (t: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Roadmap objectives
  toggleObjective: (key: string) => void;

  // Journal
  addJournalEntry: (e: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;

  // Settings
  updateSettings: (s: Partial<AppSettings>) => void;

  // Streak
  recordActivity: () => void;

  // Utils
  getTodayTemplate: () => DayTemplate | undefined;
  getHabitLogsForDate: (date: string) => HabitLog[];
  getStreakForHabit: (habitId: string) => number;
  getGlobalProgress: () => number;
}

// ─── Initial state ───────────────────────────────────────────────────────────
const INITIAL_STATE: AppState = {
  templates:    DEFAULT_TEMPLATES,
  habits:       DEFAULT_HABITS,
  habitLogs:    [],
  tasks:        [],
  objectives:   {},
  journal:      [],
  settings:     DEFAULT_SETTINGS,
  streak:       0,
  lastActiveDay: null,
};

// ─── Store ───────────────────────────────────────────────────────────────────
export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Templates ──────────────────────────────────────────────────────────
      addTemplate: (t) => set((s) => ({ templates: [...s.templates, t] })),
      updateTemplate: (t) => set((s) => ({
        templates: s.templates.map((x) => (x.id === t.id ? t : x)),
      })),
      deleteTemplate: (id) => set((s) => ({
        templates: s.templates.filter((x) => x.id !== id),
      })),

      // ── Habits ─────────────────────────────────────────────────────────────
      addHabit: (h) => set((s) => ({ habits: [...s.habits, h] })),
      updateHabit: (h) => set((s) => ({
        habits: s.habits.map((x) => (x.id === h.id ? h : x)),
      })),
      deleteHabit: (id) => set((s) => ({
        habits:    s.habits.filter((x) => x.id !== id),
        habitLogs: s.habitLogs.filter((x) => x.habitId !== id),
      })),
      toggleHabitLog: (habitId, date) => {
        const { habitLogs } = get();
        const existing = habitLogs.find((l) => l.habitId === habitId && l.date === date);
        if (existing) {
          set((s) => ({
            habitLogs: s.habitLogs.map((l) =>
              l.habitId === habitId && l.date === date ? { ...l, done: !l.done } : l,
            ),
          }));
        } else {
          set((s) => ({
            habitLogs: [...s.habitLogs, { habitId, date, done: true }],
          }));
        }
        get().recordActivity();
      },

      // ── Tasks ──────────────────────────────────────────────────────────────
      addTask: (t) => set((s) => ({ tasks: [t, ...s.tasks] })),
      toggleTask: (id) => set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined } : t,
        ),
      })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ── Objectives ─────────────────────────────────────────────────────────
      toggleObjective: (key) => set((s) => ({
        objectives: { ...s.objectives, [key]: !s.objectives[key] },
      })),

      // ── Journal ────────────────────────────────────────────────────────────
      addJournalEntry: (e) => set((s) => ({ journal: [e, ...s.journal] })),
      deleteJournalEntry: (id) => set((s) => ({
        journal: s.journal.filter((e) => e.id !== id),
      })),

      // ── Settings ───────────────────────────────────────────────────────────
      updateSettings: (s) => set((st) => ({
        settings: { ...st.settings, ...s },
      })),

      // ── Streak ─────────────────────────────────────────────────────────────
      recordActivity: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastActiveDay, streak } = get();
        if (lastActiveDay === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().slice(0, 10);
        set({
          streak: lastActiveDay === yKey ? streak + 1 : 1,
          lastActiveDay: today,
        });
      },

      // ── Computed helpers ───────────────────────────────────────────────────
      getTodayTemplate: () => {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const today = days[new Date().getDay()] as any;
        return get().templates.find((t) => t.days.includes(today));
      },

      getHabitLogsForDate: (date) =>
        get().habitLogs.filter((l) => l.date === date),

      getStreakForHabit: (habitId) => {
        const { habitLogs } = get();
        let streak = 0;
        const d = new Date();
        while (streak < 365) {
          const key = d.toISOString().slice(0, 10);
          const log = habitLogs.find((l) => l.habitId === habitId && l.date === key);
          if (log?.done) { streak++; d.setDate(d.getDate() - 1); }
          else break;
        }
        return streak;
      },

      getGlobalProgress: () => {
        const { objectives } = get();
        // 9 + 9 + 7 + 7 + 6 = 38 total objectives across 5 phases
        const total = 38;
        const done = Object.values(objectives).filter(Boolean).length;
        return total > 0 ? Math.round((done / total) * 100) : 0;
      },
    }),
    {
      name: 'flowday-app-state',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
