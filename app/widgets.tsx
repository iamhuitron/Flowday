import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/index';
import { useTheme } from '../src/hooks/useTheme';
import { haptic } from '../src/utils/haptics';
import { syncWidgetData, computeWidgetSnapshot, WidgetSnapshot } from '../src/utils/widget';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function WidgetsScreen() {
  const router = useRouter();
  const { accent } = useTheme();
  const { habits, habitLogs, streak, getTodayTemplate } = useStore();

  const todayTemplate = getTodayTemplate();
  const [snapshot, setSnapshot] = useState<WidgetSnapshot>(() =>
    computeWidgetSnapshot(todayTemplate, habits, habitLogs, streak)
  );
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const s = syncWidgetData(todayTemplate, habits, habitLogs, streak);
    setSnapshot(s);
  }, [todayTemplate, habits, habitLogs, streak]);

  const handleForceSync = () => {
    haptic('success');
    const s = syncWidgetData(todayTemplate, habits, habitLogs, streak);
    setSnapshot(s);
    setSynced(true);
    setTimeout(() => setSynced(false), 2000);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backText}>VOLVER</Text>
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>WIDGETS MÓVILES</Text>
          <Text style={s.headerSub}>Pantalla de inicio · Android e iOS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Sync Status Banner */}
        <View style={[s.syncCard, { borderColor: accent + '33', backgroundColor: accent + '0d' }]}>
          <View style={s.syncLeft}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
            <View style={{ marginLeft: 12 }}>
              <Text style={[s.syncTitle, { color: accent }]}>Sincronización en tiempo real</Text>
              <Text style={s.syncDesc}>
                Última actualización: {snapshot.lastUpdated}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleForceSync}
            style={[s.syncBtn, { backgroundColor: synced ? '#4ade80' : accent }]}
            activeOpacity={0.8}
          >
            <Text style={s.syncBtnText}>{synced ? '✓ ACTUALIZADO' : 'SINCRONIZAR'}</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Widget 1 - Current Block */}
        <Text style={s.sectionHeader}>1. WIDGET "BLOQUE DE FOCO ACTUAL" (4x2)</Text>
        <Text style={s.sectionDesc}>
          Muestra la tarea o actividad en curso con barra de progreso y cuenta atrás en tu pantalla de inicio.
        </Text>

        <View style={s.widgetFrame}>
          <View style={s.widgetBadgeRow}>
            <View style={[s.badge, { backgroundColor: '#7c6aff26', borderColor: '#7c6aff66' }]}>
              <Text style={[s.badgeText, { color: '#a78bfa' }]}>AHORA EN CURSO</Text>
            </View>
            <Text style={s.widgetTime}>{snapshot.today.timeRange}</Text>
          </View>

          <Text style={s.widgetActName}>{snapshot.today.name}</Text>

          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${snapshot.today.progressPct}%` as any, backgroundColor: accent },
              ]}
            />
          </View>

          <View style={s.widgetFooter}>
            <Text style={s.widgetNext}>{snapshot.today.next}</Text>
            <Text style={[s.widgetPct, { color: accent }]}>{snapshot.today.progressPct}%</Text>
          </View>
        </View>

        {/* Section: Widget 2 - Habits & Streak */}
        <Text style={[s.sectionHeader, { marginTop: 28 }]}>
          2. WIDGET "RACHA Y HÁBITOS DIARIOS" (2x2 / 4x1)
        </Text>
        <Text style={s.sectionDesc}>
          Mantén visible tu racha activa y el número de hábitos cumplidos hoy.
        </Text>

        <View style={[s.widgetFrame, s.widgetFrameHabits]}>
          <View style={s.habitsTop}>
            <Text style={s.streakBig}>🔥 {snapshot.habits.streak} DÍAS</Text>
            <View style={[s.ratioPill, { backgroundColor: '#4ade801a', borderColor: '#4ade8044' }]}>
              <Text style={s.ratioText}>
                {snapshot.habits.done} / {snapshot.habits.total} COMPLETADOS
              </Text>
            </View>
          </View>

          <View style={s.dotsPreviewRow}>
            {habits.slice(0, 6).map((h) => {
              const isDone = habitLogs.some(
                (l) => l.habitId === h.id && l.date === new Date().toISOString().slice(0, 10) && l.done
              );
              return (
                <View
                  key={h.id}
                  style={[
                    s.habitDotMini,
                    { backgroundColor: isDone ? '#4ade80' : '#262633' },
                  ]}
                />
              );
            })}
          </View>

          <Text style={s.habitsBrand}>FLOWDAY · CONSISTENCIA</Text>
        </View>

        {/* How to add to Home Screen */}
        <View style={s.guideCard}>
          <Text style={s.guideTitle}>📱 CÓMO AGREGAR A TU PANTALLA DE INICIO</Text>
          
          <View style={s.guideStep}>
            <Text style={[s.stepNum, { color: accent }]}>01</Text>
            <Text style={s.stepTxt}>
              Ve a la pantalla principal de tu teléfono y <Text style={{ fontWeight: '700', color: '#fff' }}>mantén presionado un espacio vacío</Text>.
            </Text>
          </View>

          <View style={s.guideStep}>
            <Text style={[s.stepNum, { color: accent }]}>02</Text>
            <Text style={s.stepTxt}>
              Toca en el menú de <Text style={{ fontWeight: '700', color: '#fff' }}>Widgets</Text> y busca <Text style={{ fontWeight: '700', color: accent }}>FlowDay</Text>.
            </Text>
          </View>

          <View style={s.guideStep}>
            <Text style={[s.stepNum, { color: accent }]}>03</Text>
            <Text style={s.stepTxt}>
              Selecciona el widget deseado (<Text style={{ color: '#fff' }}>Bloque Actual</Text> o <Text style={{ color: '#fff' }}>Racha de Hábitos</Text>) y arrástralo a tu pantalla.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a22',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    borderRightWidth: 1,
    borderRightColor: '#262633',
  },
  backArrow: { fontSize: 18, color: '#eeeef5', marginRight: 6 },
  backText: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: '#eeeef5', letterSpacing: 1.5 },
  headerTitleWrap: { marginLeft: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  headerSub: { fontSize: 12, color: '#77778a', marginTop: 1 },
  content: { padding: 20, paddingBottom: 60 },

  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  syncLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  syncTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  syncDesc: { fontSize: 12, color: '#888899', marginTop: 2, fontFamily: MONO },
  syncBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  syncBtnText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  sectionHeader: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: '#a78bfa', letterSpacing: 1.5 },
  sectionDesc: { fontSize: 13, color: '#888899', marginTop: 4, marginBottom: 14, lineHeight: 18 },

  widgetFrame: {
    backgroundColor: '#141419',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#262633',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  widgetFrameHabits: {
    alignItems: 'center',
    paddingVertical: 22,
  },
  widgetBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  widgetTime: { fontFamily: MONO, fontSize: 11, color: '#888899' },
  widgetActName: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 12 },

  progressTrack: {
    height: 6,
    backgroundColor: '#262633',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  widgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widgetNext: { fontSize: 12, color: '#a1a1b5', flex: 1 },
  widgetPct: { fontFamily: MONO, fontSize: 12, fontWeight: '700' },

  habitsTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  streakBig: { fontSize: 24, fontWeight: '800', color: '#fbbf24', letterSpacing: 0.5 },
  ratioPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratioText: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: '#4ade80', letterSpacing: 1 },
  dotsPreviewRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  habitDotMini: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  habitsBrand: { fontFamily: MONO, fontSize: 10, fontWeight: '700', color: '#55556a', letterSpacing: 1.5, marginTop: 4 },

  guideCard: {
    backgroundColor: '#121216',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f28',
    padding: 18,
    marginTop: 32,
  },
  guideTitle: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: '#eeeef5', letterSpacing: 1.5, marginBottom: 14 },
  guideStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepNum: { fontFamily: MONO, fontSize: 13, fontWeight: '800', width: 28 },
  stepTxt: { fontSize: 13, color: '#a1a1b5', flex: 1, lineHeight: 19 },
});
