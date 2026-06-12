/**
 * FlowDay — useTheme hook
 * Lee el accentColor del store y genera tokens derivados listos para usar
 * en StyleSheet dinámicos o props de style inline.
 *
 * Uso:
 *   const { accent, accentBg, accentBorder, accentMid } = useTheme();
 *   <View style={{ borderColor: accentBorder }} />
 */

import { useStore } from '../store/index';

export interface Theme {
  /** Color sólido del acento — ej. '#7c6aff'                        */
  accent:       string;
  /** Fondo tenue (12% opacidad) — para cards activas, highlights    */
  accentBg:     string;
  /** Borde suave (30% opacidad) — para bordes de cards/inputs       */
  accentBorder: string;
  /** Tono medio (60% opacidad) — para badges, separadores activos   */
  accentMid:    string;
  /** Tab bar active color — igual que accent                        */
  tabActive:    string;
  /** Tab bar inactive color                                          */
  tabInactive:  string;
}

const DEFAULT_ACCENT = '#7c6aff';

export function useTheme(): Theme {
  const accent = useStore((s) => s.settings.accentColor) ?? DEFAULT_ACCENT;
  return {
    accent,
    accentBg:     accent + '1e',   // ~12%
    accentBorder: accent + '4d',   // ~30%
    accentMid:    accent + '99',   // ~60%
    tabActive:    accent,
    tabInactive:  '#55556a',
  };
}
