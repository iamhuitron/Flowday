/**
 * FlowDay — Backup Service
 * Export: serializa el estado a JSON → share sheet del sistema
 * Import: abre el document picker, valida y devuelve los datos
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing    from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  DayTemplate, Habit, HabitLog, Task,
  JournalEntry, AppSettings,
} from '../types/index';

// ─── Backup shape ─────────────────────────────────────────────────────────────
export interface FlowDayBackup {
  app:        'FlowDay';
  version:    string;
  exportedAt: string;
  data: {
    templates:  DayTemplate[];
    habits:     Habit[];
    habitLogs:  HabitLog[];
    tasks:      Task[];
    objectives: Record<string, boolean>;
    journal:    JournalEntry[];
    settings:   AppSettings;
  };
}

export type ImportResult =
  | { ok: true;  backup: FlowDayBackup }
  | { ok: false; error: string };

// ─── Export ───────────────────────────────────────────────────────────────────
export async function exportBackup(backup: FlowDayBackup): Promise<void> {
  const json     = JSON.stringify(backup, null, 2);
  const date     = new Date().toISOString().slice(0, 10);
  const fileName = `flowday-backup-${date}.json`;
  const fileUri  = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('El compartir archivos no está disponible en este dispositivo.');

  await Sharing.shareAsync(fileUri, {
    mimeType:    'application/json',
    dialogTitle: 'Guardar respaldo de FlowDay',
    UTI:         'public.json',
  });
}

// ─── Import ───────────────────────────────────────────────────────────────────
export async function pickAndParseBackup(): Promise<ImportResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { ok: false, error: 'Cancelado' };
    }

    const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed = JSON.parse(raw);

    // Validación básica de estructura
    if (parsed.app !== 'FlowDay' || !parsed.data || !parsed.version) {
      return { ok: false, error: 'El archivo no es un respaldo válido de FlowDay.' };
    }

    const { data } = parsed;
    if (!Array.isArray(data.templates) || !Array.isArray(data.habits)) {
      return { ok: false, error: 'El respaldo está incompleto o corrupto.' };
    }

    return { ok: true, backup: parsed as FlowDayBackup };
  } catch (e: any) {
    if (e?.message?.includes('Cancelado')) return { ok: false, error: 'Cancelado' };
    return { ok: false, error: `Error al leer el archivo: ${e?.message ?? 'desconocido'}` };
  }
}

// ─── Summary helper (para mostrar en el Alert de confirmación) ────────────────
export function backupSummary(b: FlowDayBackup): string {
  const { data } = b;
  const date = new Date(b.exportedAt).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  return [
    `📅 Exportado: ${date}`,
    `📋 Plantillas: ${data.templates.length}`,
    `🔥 Hábitos: ${data.habits.length}`,
    `✅ Logs de hábitos: ${data.habitLogs.length}`,
    `📝 Tareas: ${data.tasks.length}`,
    `📖 Entradas de diario: ${data.journal.length}`,
  ].join('\n');
}
