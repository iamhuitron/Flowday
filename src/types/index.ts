// ─── Activity / Schedule ─────────────────────────────────────────────────────

export type ActivityCategory =
  | 'sleep' | 'wake' | 'training' | 'eating' | 'hygiene'
  | 'study'  | 'break' | 'commute'  | 'work'  | 'write' | 'custom';

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category: ActivityCategory;
  startTime: string;
  duration: number;
  color?: string;
  icon?: string;
  notifyBefore?: number;
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

// ─── Habit Tracker ───────────────────────────────────────────────────────────

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
  date: string;
  done: boolean;
}

// ─── Road Map / Goals ────────────────────────────────────────────────────────

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

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  firstDayOfWeek: DayOfWeek;
  notificationsEnabled: boolean;
  notifyActivities: boolean;
  notifySummary: boolean;
  streakGoal: number;
  // ── Onboarding ──
  hasOnboarded: boolean;
  userName: string;
}

// ─── Store root ──────────────────────────────────────────────────────────────

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
