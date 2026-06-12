import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState, DayTemplate, Habit, HabitLog,
  Task, JournalEntry, AppSettings,
} from '@types/index';
import {
  DEFAULT_SETTINGS, DEFAULT_TEMPLATES, DEFAULT_HABITS,
} from '@constants/index';
import { platformStorage } from '@utils/storage';

// ─── Store actions ───────────────────────────────────────────────────────────
interface StoreActions {
  addTemplate:         (t: DayTemplate)           => void;
  updateTemplate:      (t: DayTemplate)           => void;
  deleteTemplate:      (id: string)               => void;
  addHabit:            (h: Habit)                 => void;
  updateHabit:         (h: Habit)                 => void;
  deleteHabit:         (id: string)               => void;
  toggleHabitLog:      (habitId: string, date: string) => void;
  addTask:             (t: Task)                  => void;
  updateTask:          (t: Task)                  => void;
  toggleTask:          (id: string)               => void;
  deleteTask:          (id: string)               => void;
  toggleObjective:     (key: string)              => void;
  addJournalEntry:     (e: JournalEntry)          => void;
  updateJournalEntry:  (e: JournalEntry)          => void;
  deleteJournalEntry:  (id: string)               => void;
  updateSettings:      (s: Partial<AppSettings>)  => void;
  recordActivity:      ()                         => void;
  importData:          (data: Partial<AppState>)  => void;
  resetStore:          ()                         => void;
  getTodayTemplate:    ()                         => DayTemplate | undefined;
  getHabitLogsForDate: (date: string)             => HabitLog[];
  getStreakForHabit:   (habitId: string)          => number;
  getGlobalProgress:   ()                         => number;
}

// ─── Initial state ───────────────────────────────────────────────────────────
const INITIAL_STATE: AppState = {
  templates:     DEFAULT_TEMPLATES,
  habits:        DEFAULT_HABITS,
  habitLogs:     [],
  tasks:         [],
  objectives:    {},
  journal:       [],
  settings:      DEFAULT_SETTINGS,
  streak:        0,
  lastActiveDay: null,
};

// ─── Store ───────────────────────────────────────────────────────────────────
export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Templates ─────────────────────────────────────────────────────────
      addTemplate:    (t) => set((s) => ({ templates: [...s.templates, t] })),
      updateTemplate: (t) => set((s) => ({ templates: s.templates.map((x) => x.id === t.id ? t : x) })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((x) => x.id !== id) })),

      // ── Habits ────────────────────────────────────────────────────────────
      addHabit:    (h)  => set((s) => ({ habits: [...s.habits, h] })),
      updateHabit: (h)  => set((s) => ({ habits: s.habits.map((x) => x.id === h.id ? h : x) })),
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
          set((s) => ({ habitLogs: [...s.habitLogs, { habitId, date, done: true }] }));
        }
        get().recordActivity();
      },

      // ── Tasks ─────────────────────────────────────────────────────────────
      addTask:    (t)  => set((s) => ({ tasks: [t, ...s.tasks] })),
      updateTask: (t)  => set((s) => ({ tasks: s.tasks.map((x) => x.id === t.id ? t : x) })),
      toggleTask: (id) => set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
            : t,
        ),
      })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // ── Objectives ────────────────────────────────────────────────────────
      toggleObjective: (key) => set((s) => ({
        objectives: { ...s.objectives, [key]: !s.objectives[key] },
      })),

      // ── Journal ───────────────────────────────────────────────────────────
      addJournalEntry:    (e)  => set((s) => ({ journal: [e, ...s.journal] })),
      updateJournalEntry: (e)  => set((s) => ({
        journal: s.journal.map((x) => x.id === e.id ? e : x),
      })),
      deleteJournalEntry: (id) => set((s) => ({
        journal: s.journal.filter((e) => e.id !== id),
      })),

      // ── Settings ──────────────────────────────────────────────────────────
      updateSettings: (patch) => set((s) => ({
        settings: { ...s.settings, ...patch },
      })),

      // ── Streak ────────────────────────────────────────────────────────────
      recordActivity: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastActiveDay, streak } = get();
        if (lastActiveDay === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        set({
          streak:        lastActiveDay === yesterday.toISOString().slice(0, 10) ? streak + 1 : 1,
          lastActiveDay: today,
        });
      },

      // ── Backup ────────────────────────────────────────────────────────────
      importData: (data) => set((s) => ({
        templates:  data.templates  ?? s.templates,
        habits:     data.habits     ?? s.habits,
        habitLogs:  data.habitLogs  ?? s.habitLogs,
        tasks:      data.tasks      ?? s.tasks,
        objectives: data.objectives ?? s.objectives,
        journal:    data.journal    ?? s.journal,
        settings:   data.settings   ? { ...DEFAULT_SETTINGS, ...data.settings } : s.settings,
      })),
      resetStore: () => set(INITIAL_STATE),

      // ── Computed ──────────────────────────────────────────────────────────
      getTodayTemplate: () => {
        const days = ['sun','mon','tue','wed','thu','fri','sat'];
        const today = days[new Date().getDay()] as any;
        return get().templates.find((t) => t.days.includes(today));
      },
      getHabitLogsForDate: (date) => get().habitLogs.filter((l) => l.date === date),
      getStreakForHabit: (habitId) => {
        const { habitLogs } = get();
        let streak = 0;
        const d = new Date();
        while (streak < 365) {
          const key = d.toISOString().slice(0, 10);
          if (habitLogs.find((l) => l.habitId === habitId && l.date === key)?.done) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else break;
        }
        return streak;
      },
      getGlobalProgress: () => {
        const { objectives } = get();
        const total = 38;
        const done  = Object.values(objectives).filter(Boolean).length;
        return total > 0 ? Math.round((done / total) * 100) : 0;
      },
    }),
    {
      name:    'flowday-app-state',
      storage: platformStorage,   // ← plataforma automática (MMKV/localStorage)
    },
  ),
);
