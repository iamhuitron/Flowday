/**
 * FlowDay — Platform-aware storage adapter para Zustand persist
 *
 * - Web  → localStorage (MMKV no está disponible en browser)
 * - Native → MMKV (rápido, síncrono, persistente)
 */

import { Platform } from 'react-native';
import { createJSONStorage, StateStorage } from 'zustand/middleware';

function buildNativeStorage(): StateStorage {
  // Import dinámico para evitar que el bundler web intente cargar MMKV
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({ id: 'flowday-store' });
  return {
    getItem:    (key)        => mmkv.getString(key) ?? null,
    setItem:    (key, value) => mmkv.set(key, value),
    removeItem: (key)        => mmkv.delete(key),
  };
}

function buildWebStorage(): StateStorage {
  return {
    getItem: (key) => {
      try { return localStorage.getItem(key); }
      catch { return null; }
    },
    setItem: (key, value) => {
      try { localStorage.setItem(key, value); }
      catch { /* quota exceeded o modo privado */ }
    },
    removeItem: (key) => {
      try { localStorage.removeItem(key); }
      catch {}
    },
  };
}

export const platformStorage = createJSONStorage(
  () => Platform.OS === 'web' ? buildWebStorage() : buildNativeStorage(),
);
