// ─── Activity / Schedule ────────────────────────────────────────────────────

export type ActivityCategory =
  | 'sleep' | 'wake' | 'training' | 'eating' | 'hygiene'
  | 'study'  | 'break' | 'commute'  | 'work'  | 'write' | 'custom';

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category: ActivityCategory;
  startTime: string;     // "HH:mm"
  duration: number;      // minutes
  color?: string;
  icon?: string;
  notifyBefore?: number; // minutes before, 0 = disabled
}

export interface DayTemplate {
  id: string;
  name: string;
  days: DayOfWeek[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// ─── Habit Tracker ──────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color?: string;
  targetDays: DayOfWeek[];
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;  // "YYYY-MM-DD"
  done: boolean;
}

// ─── Road Map / Goals ───────────────────────────────────────────────────────

export interface RoadmapPhase {
  id: string;
  order: number;
  name: string;
  color: string;
  semester: string;
  milestone: string;
  objectives: RoadmapObjective[];
}

export interface RoadmapObjective {
  id: string;
  phaseId: string;
  text: string;
  done: boolean;
  doneAt?: string;
}

// ─── Task ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  name: string;
  phaseId?: string;
  done: boolean;
  createdAt: string;
  doneAt?: string;
  priority?: 'low' | 'mid' | 'high';
}

// ─── Journal / Log ──────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  date: string;  // "YYYY-MM-DD"
  text: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
}

// ─── App Settings ───────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  firstDayOfWeek: DayOfWeek;
  notificationsEnabled: boolean;  // Recordatorios de hábitos (9:00 AM)
  notifyActivities: boolean;      // Alertas de actividad (notifyBefore)
  notifySummary: boolean;         // Resumen diario (10:00 PM)
  streakGoal: number;
}

// ─── Store root ─────────────────────────────────────────────────────────────

export interface AppState {
  templates: DayTemplate[];
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  objectives: Record<string, boolean>;
  journal: JournalEntry[];
  settings: AppSettings;
  streak: number;
  lastActiveDay: string | null;
}
