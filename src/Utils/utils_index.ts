import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(date: string, fmt = "d 'de' MMMM"): string {
  return format(parseISO(date + 'T12:00:00'), fmt, { locale: es });
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
