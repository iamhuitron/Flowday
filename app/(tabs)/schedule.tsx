import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '../../src/store/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../src/constants/index';
import { Activity } from '../../src/types/index';

// ─── Constants ────────────────────────────────────────────────────────────────
const PX_PER_MIN = 1.05;
const LABEL_WIDTH = 52;
const HOUR_HEIGHT = PX_PER_MIN * 60;
const TIMELINE_H  = PX_PER_MIN * 60 * 24 + 80;
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
function getNowMins(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

// ─── Activity Block ───────────────────────────────────────────────────────────
function ActivityBlock({
  activity,
  onPress,
  delay = 0,
}: {
  activity: Activity;
  onPress: (a: Activity) => void;
  delay?: number;
}) {
  const anim   = useRef(new Animated.Value(0)).current;
  const color  = activity.color ?? CATEGORY_COLORS[activity.category];
  const icon   = CATEGORY_ICONS[activity.category];
  const top    = timeToMins(activity.startTime) * PX_PER_MIN;
  const height = Math.max(activity.duration * PX_PER_MIN, 28);
  const isShort = height < 42;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.activityWrap,
        {
          top,
          height,
          opacity: anim,
          transform: [{
            translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
          }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(activity)}
        activeOpacity={0.75}
        style={[
          styles.activityCard,
          { backgroundColor: color + '18', borderColor: color + '35' },
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: color }]} />
        <View style={styles.activityContent}>
          <Text style={[styles.activityName, { color }]} numberOfLines={1}>
            {icon} {activity.name}
          </Text>
          {!isShort && activity.description ? (
            <Text style={[styles.activityDesc, { color: color + 'aa' }]} numberOfLines={1}>
              {activity.description}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.activityDur, { color: color + '88' }]}>
          {formatDuration(activity.duration)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Hour Grid ────────────────────────────────────────────────────────────────
function HourGrid() {
  return (
    <>
      {Array.from({ length: 25 }, (_, h) => {
        const y = h * HOUR_HEIGHT;
        return (
          <View key={h} style={{ position: 'absolute', left: 0, right: 0, top: y }}>
            {h > 0 ? (
              <Text style={styles.hourLabel}>{String(h).padStart(2, '0')}:00</Text>
            ) : null}
            <View style={styles.hourLine} />
          </View>
        );
      })}
    </>
  );
}

// ─── Now Line ─────────────────────────────────────────────────────────────────
function NowLine() {
  const y = getNowMins() * PX_PER_MIN;
  return (
    <View style={[styles.nowLine, { top: y }]} pointerEvents="none">
      <View style={styles.nowDot} />
    </View>
  );
}

// ─── Detail Drawer (pure RN, no external sheet lib) ──────────────────────────
function ActivityDrawer({
  activity,
  visible,
  onClose,
}: {
  activity: Activity | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!activity) return null;

  const color   = activity.color ?? CATEGORY_COLORS[activity.category];
  const icon    = CATEGORY_ICONS[activity.category];
  const endTime = minsToTime(timeToMins(activity.startTime) + activity.duration);

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <View style={styles.drawerHandle} />

        <TouchableOpacity style={styles.drawerClose} onPress={onClose}>
          <Text style={styles.drawerCloseText}>✕</Text>
        </TouchableOpacity>

        <View style={[styles.catPill, { backgroundColor: color + '18', borderColor: color + '33' }]}>
          <Text style={[styles.catPillText, { color }]}>{icon} {activity.category.toUpperCase()}</Text>
        </View>

        <Text style={styles.drawerTitle}>{activity.name}</Text>

        {activity.description ? (
          <Text style={styles.drawerDesc}>{activity.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          {[`⏰ ${activity.startTime}`, `⏱ ${formatDuration(activity.duration)}`, `→ ${endTime}`].map((lbl) => (
            <View key={lbl} style={styles.metaPill}>
              <Text style={styles.metaPillText}>{lbl}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const { templates } = useStore();
  const scrollRef = useRef<ScrollView>(null);
  const [activeId, setActiveId]           = useState(templates[0]?.id ?? '');
  const [selected, setSelected]           = useState<Activity | null>(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  const activeTemplate = templates.find((t) => t.id === activeId) ?? templates[0];

  // Scroll to current time – 2h on mount
  useEffect(() => {
    const y = Math.max(0, (getNowMins() - 120) * PX_PER_MIN);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 400);
  }, []);

  const handleActivityPress = useCallback((a: Activity) => {
    setSelected(a);
    setDrawerOpen(true);
  }, []);

  const handleTabPress = (id: string) => {
    setActiveId(id);
    const y = Math.max(0, (getNowMins() - 120) * PX_PER_MIN);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 100);
  };

  // Header strings
  const dayLabels: Record<string, string> = {
    mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue',
    fri: 'Vie', sat: 'Sáb', sun: 'Dom',
  };
  const daysStr  = activeTemplate?.days.map((d) => dayLabels[d]).join(' · ') ?? '';
  const todayStr = format(new Date(), "EEE d MMM", { locale: es }).toUpperCase();
  const pct      = (getNowMins() / 1440) * 100;

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Horario</Text>
          <Text style={styles.headerSub}>{todayStr} · {daysStr}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Template tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {templates.map((t, i) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => handleTabPress(t.id)}
            style={[styles.tab, activeId === t.id && styles.tabActive]}
            activeOpacity={0.7}
          >
            <View style={[
              styles.tabDot,
              { backgroundColor: i === 0 ? '#7c6aff' : '#ff6a8e' },
            ]} />
            <Text style={[styles.tabText, activeId === t.id && styles.tabTextActive]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.tab, styles.tabDashed]} activeOpacity={0.7}>
          <Text style={styles.tabText}>+ Nueva</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Day progress bar ── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>

      {/* ── Timeline ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={{ height: TIMELINE_H }}
        showsVerticalScrollIndicator={false}
      >
        <HourGrid />
        {activeTemplate?.activities.map((a, i) => (
          <ActivityBlock
            key={a.id}
            activity={a}
            onPress={handleActivityPress}
            delay={i * 25}
          />
        ))}
        <NowLine />
      </ScrollView>

      {/* ── Activity detail drawer ── */}
      <ActivityDrawer
        activity={selected}
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

    </SafeAreaView>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0c0c0f' },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  headerTitle:     { fontSize: 18, fontWeight: '600', color: '#eeeef5', letterSpacing: -0.3 },
  headerSub:       { fontFamily: MONO, fontSize: 10, color: '#55556a', marginTop: 2 },
  addBtn:          { width: 34, height: 34, borderRadius: 10, backgroundColor: '#7c6aff', alignItems: 'center', justifyContent: 'center' },
  addBtnText:      { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300' },

  // Tabs
  tabsScroll:      { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  tabsContent:     { paddingHorizontal: 14, paddingVertical: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tab:             { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#26262f', backgroundColor: '#141418', flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive:       { backgroundColor: 'rgba(124,106,255,.12)', borderColor: '#7c6aff' },
  tabDashed:       { borderStyle: 'dashed', opacity: 0.6 },
  tabDot:          { width: 6, height: 6, borderRadius: 3 },
  tabText:         { fontFamily: MONO, fontSize: 11, color: '#55556a' },
  tabTextActive:   { color: '#7c6aff' },

  // Progress
  progressTrack:   { height: 2, backgroundColor: '#1c1c22' },
  progressFill:    { height: 2, backgroundColor: '#7c6aff' },

  // Timeline
  scrollArea:      { flex: 1 },
  hourLabel:       { position: 'absolute', left: 0, width: LABEL_WIDTH, textAlign: 'right', paddingRight: 8, paddingTop: 2, fontFamily: MONO, fontSize: 9, color: '#55556a' },
  hourLine:        { position: 'absolute', left: LABEL_WIDTH, right: 0, height: 1, backgroundColor: '#26262f' },

  // Activity block
  activityWrap:    { position: 'absolute', left: LABEL_WIDTH + 8, right: 14 },
  activityCard:    { flex: 1, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  accentBar:       { width: 3, alignSelf: 'stretch' },
  activityContent: { flex: 1, paddingHorizontal: 10, paddingVertical: 7 },
  activityName:    { fontSize: 13, fontWeight: '500' },
  activityDesc:    { fontSize: 11, marginTop: 2 },
  activityDur:     { paddingRight: 10, fontFamily: MONO, fontSize: 10 },

  // Now line
  nowLine:         { position: 'absolute', left: LABEL_WIDTH, right: 0, height: 1, backgroundColor: '#7c6aff' },
  nowDot:          { position: 'absolute', left: -4, top: -4, width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#7c6aff' },

  // Drawer
  overlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 10 },
  drawer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141418', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: '#26262f', padding: 20, paddingBottom: 36, zIndex: 20 },
  drawerHandle:    { width: 36, height: 3, backgroundColor: '#26262f', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
  drawerClose:     { position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  drawerCloseText: { color: '#55556a', fontSize: 12 },
  catPill:         { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1, marginBottom: 12 },
  catPillText:     { fontFamily: MONO, fontSize: 10 },
  drawerTitle:     { fontSize: 22, fontWeight: '600', color: '#eeeef5', marginBottom: 6, letterSpacing: -0.3 },
  drawerDesc:      { fontSize: 14, color: '#55556a', lineHeight: 22, marginBottom: 16 },
  metaRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill:        { backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  metaPillText:    { fontFamily: MONO, fontSize: 11, color: '#55556a' },
});
