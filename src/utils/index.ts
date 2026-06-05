import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** "HH:mm" → total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** minutes from midnight → "HH:mm" */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** duration in minutes → human string "2h 30min" */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/** "YYYY-MM-DD" today key */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Format date for display */
export function formatDate(date: string, fmt = "d 'de' MMMM"): string {
  return format(parseISO(date + 'T12:00:00'), fmt, { locale: es });
}

/** Generate a simple unique ID */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
