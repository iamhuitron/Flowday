import { DayTemplate, AppSettings } from '@types/index';

// ─── Activity category → color ───────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  sleep:    '#6b7fff',
  wake:     '#4ade80',
  training: '#ff6a8e',
  eating:   '#fbbf24',
  hygiene:  '#22d3ee',
  study:    '#a78bfa',
  break:    '#94a3b8',
  commute:  '#f97316',
  work:     '#34d399',
  write:    '#fb7185',
  custom:   '#e8e8f0',
};

export const CATEGORY_ICONS: Record<string, string> = {
  sleep:    '🌙',
  wake:     '☀️',
  training: '🏋️',
  eating:   '🍽️',
  hygiene:  '🚿',
  study:    '📚',
  break:    '☕',
  commute:  '🚌',
  work:     '💼',
  write:    '✍️',
  custom:   '⚡',
};

// ─── Default settings ────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  theme:                'dark',
  accentColor:          '#7c6aff',
  firstDayOfWeek:       'mon',
  notificationsEnabled: true,
  notifyActivities:     true,
  notifySummary:        true,
  streakGoal:           7,
  hasOnboarded:         false,
  userName:             '',
};

// ─── Pre-loaded templates (TimeTune) ─────────────────────────────────────────
export const DEFAULT_TEMPLATES: DayTemplate[] = [
  {
    id: 'template-lmv',
    name: 'LMV',
    days: ['mon', 'wed', 'fri'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      { id: 'lmv-1',  name: 'Dormir',               description: 'Meditar y Descansar',                                          category: 'sleep',    startTime: '00:00', duration: 420 },
      { id: 'lmv-2',  name: 'Despertar',             description: 'Lavarse la cara, diario estoico, journaling, estiramientos',  category: 'wake',     startTime: '07:00', duration: 20  },
      { id: 'lmv-3',  name: 'Ejercicio',             description: 'Rutina A/B Santi Grazino',                                    category: 'training', startTime: '07:20', duration: 40, notifyBefore: 5 },
      { id: 'lmv-4',  name: 'Desayuno',              description: 'Comida del día anterior, huevo, licuado, café',               category: 'eating',   startTime: '08:00', duration: 30  },
      { id: 'lmv-5',  name: 'Higiene',               description: 'Bañarse, rasurar, dientes, enjuague, desodorante',            category: 'hygiene',  startTime: '08:30', duration: 30  },
      { id: 'lmv-6',  name: 'Curso',                 description: 'Estudiar el curso en curso',                                  category: 'study',    startTime: '09:00', duration: 60  },
      { id: 'lmv-7',  name: 'Tarea',                 description: 'Tarea y repaso de universidad, o leer algo',                  category: 'study',    startTime: '10:00', duration: 120 },
      { id: 'lmv-8',  name: 'Ocio',                  description: 'Hacer lo que yo quiera',                                      category: 'break',    startTime: '12:00', duration: 60  },
      { id: 'lmv-9',  name: 'Comida',                description: 'Comer bien, café',                                            category: 'eating',   startTime: '13:00', duration: 30  },
      { id: 'lmv-10', name: 'Preparar universidad',  description: 'Poner horario, asegurar que todo esté correcto',              category: 'work',     startTime: '13:30', duration: 60  },
      { id: 'lmv-11', name: 'Ida',                   description: 'Camino hacia la FES, leer algo',                              category: 'commute',  startTime: '14:30', duration: 90, notifyBefore: 10 },
      { id: 'lmv-12', name: 'Universidad',           description: 'Atención, contactos, networking, interacción social',         category: 'work',     startTime: '16:00', duration: 300, notifyBefore: 15 },
      { id: 'lmv-13', name: 'Regreso',               description: 'Volver de la FES, aprovechar para leer algo o dormir',        category: 'commute',  startTime: '21:00', duration: 150 },
      { id: 'lmv-14', name: 'Cena',                  description: 'Cena ligera',                                                 category: 'eating',   startTime: '23:30', duration: 30  },
    ],
  },
  {
    id: 'template-mj',
    name: 'MJ',
    days: ['tue', 'thu'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      { id: 'mj-1',  name: 'Dormir',      description: 'Meditar y Descansar',                                          category: 'sleep',   startTime: '00:00', duration: 420 },
      { id: 'mj-2',  name: 'Despertar',   description: 'Lavarse la cara, diario estoico, journaling, estiramientos',  category: 'wake',    startTime: '07:00', duration: 20  },
      { id: 'mj-3',  name: 'Escribir',    description: 'Sueños, o cualquier cosa que tenga en mente',                  category: 'write',   startTime: '07:20', duration: 40  },
      { id: 'mj-4',  name: 'Desayuno',    description: 'Comida del día anterior, huevo, licuado, café',               category: 'eating',  startTime: '08:00', duration: 30  },
      { id: 'mj-5',  name: 'Higiene',     description: 'Bañarse, rasurar, dientes, enjuague, desodorante',            category: 'hygiene', startTime: '08:30', duration: 30  },
      { id: 'mj-6',  name: 'Curso',       description: 'Estudiar el curso en curso',                                  category: 'study',   startTime: '09:00', duration: 60  },
      { id: 'mj-7',  name: 'Tarea',       description: 'Tarea y repaso de universidad, o leer algo',                  category: 'study',   startTime: '10:00', duration: 120 },
      { id: 'mj-8',  name: 'Ocio',        description: 'Hacer lo que yo quiera',                                      category: 'break',   startTime: '12:00', duration: 60  },
      { id: 'mj-9',  name: 'Comida',      description: 'Comer bien, café',                                            category: 'eating',  startTime: '13:00', duration: 30  },
      { id: 'mj-10', name: 'Ida',         description: 'Camino hacia la FES, leer algo, checar pendientes',           category: 'commute', startTime: '13:30', duration: 90, notifyBefore: 10 },
      { id: 'mj-11', name: 'Universidad', description: 'Atención, contactos, networking, interacción social',         category: 'work',    startTime: '15:00', duration: 360, notifyBefore: 15 },
      { id: 'mj-12', name: 'Regreso',     description: 'Volver de la FES, aprovechar para leer algo o dormir',        category: 'commute', startTime: '21:00', duration: 150 },
      { id: 'mj-13', name: 'Cena',        description: 'Cena ligera',                                                 category: 'eating',  startTime: '23:30', duration: 30  },
    ],
  },
];

// ─── Default habits ──────────────────────────────────────────────────────────
export const DEFAULT_HABITS = [
  { id: 'h-1', name: 'Código Python',   icon: '🐍', color: '#4ade80', targetDays: ['mon','tue','wed','thu','fri'] as any,               createdAt: new Date().toISOString() },
  { id: 'h-2', name: 'LeetCode',        icon: '⚡', color: '#fbbf24', targetDays: ['mon','tue','wed','thu','fri'] as any,               createdAt: new Date().toISOString() },
  { id: 'h-3', name: 'Inglés 30 min',   icon: '🌐', color: '#60a5fa', targetDays: ['mon','tue','wed','thu','fri','sat','sun'] as any,   createdAt: new Date().toISOString() },
  { id: 'h-4', name: 'Commit a GitHub', icon: '💾', color: '#a78bfa', targetDays: ['mon','tue','wed','thu','fri'] as any,               createdAt: new Date().toISOString() },
  { id: 'h-5', name: 'Leer docs',       icon: '📖', color: '#f97316', targetDays: ['mon','tue','wed','thu','fri'] as any,               createdAt: new Date().toISOString() },
  { id: 'h-6', name: 'Ejercicio',       icon: '🏋️', color: '#ff6a8e', targetDays: ['mon','wed','fri'] as any,                          createdAt: new Date().toISOString() },
  { id: 'h-7', name: 'Journaling',      icon: '✍️', color: '#fb7185', targetDays: ['mon','tue','wed','thu','fri','sat','sun'] as any,   createdAt: new Date().toISOString() },
];
