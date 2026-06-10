import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, StyleSheet, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../src/constants/index';
import { Activity } from '../../src/types/index';
import { timeToMinutes, formatDuration, minutesToTime } from '../../src/utils/index';

const MONO       = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const PX_PER_MIN = 1.05;
const LABEL_W    = 52;
const HOUR_H     = PX_PER_MIN * 60;
const TIMELINE_H = PX_PER_MIN * 60 * 24 + 80;

function getNowMins() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

// ─── Activity Block ───────────────────────────────────────────────────────────
function ActivityBlock({
  activity, onPress, delay = 0,
}: { activity: Activity; onPress: (a: Activity) => void; delay?: number }) {
  const anim   = useRef(new Animated.Value(0)).current;
  const color  = activity.color ?? CATEGORY_COLORS[activity.category];
  const icon   = CATEGORY_ICONS[activity.category];
  const top    = timeToMinutes(activity.startTime) * PX_PER_MIN;
  const height = Math.max(activity.duration * PX_PER_MIN, 28);
  const isShort = height < 42;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, []);

  return (
    <Animated.View style={[
      s.actWrap, { top, height,
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
      },
    ]}>
      <TouchableOpacity
        onPress={() => onPress(activity)}
        activeOpacity={0.75}
        style={[s.actCard, { backgroundColor: color + '18', borderColor: color + '35' }]}
      >
        <View style={[s.actAccent, { backgroundColor: color }]} />
        <View style={s.actContent}>
          <Text style={[s.actName, { color }]} numberOfLines={1}>{icon} {activity.name}</Text>
          {!isShort && activity.description
            ? <Text style={[s.actDesc, { color: color + 'aa' }]} numberOfLines={1}>{activity.description}</Text>
            : null}
        </View>
        <Text style={[s.actDur, { color: color + '88' }]}>{formatDuration(activity.duration)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Hour Grid ────────────────────────────────────────────────────────────────
function HourGrid() {
  return (
    <>
      {Array.from({ length: 25 }, (_, h) => (
        <View key={h} style={{ position: 'absolute', left: 0, right: 0, top: h * HOUR_H }}>
          {h > 0 ? <Text style={s.hourLabel}>{String(h).padStart(2, '0')}:00</Text> : null}
          <View style={s.hourLine} />
        </View>
      ))}
    </>
  );
}

// ─── Now Line ─────────────────────────────────────────────────────────────────
function NowLine() {
  const y = getNowMins() * PX_PER_MIN;
  return (
    <View style={[s.nowLine, { top: y }]} pointerEvents="none">
      <View style={s.nowDot} />
    </View>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function ActivityDrawer({
  activity, visible, onClose, onEdit, onDelete,
}: {
  activity: Activity | null;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // FIX: llamadas separadas — ambas usan native driver, pero por claridad las separamos
      Animated.spring(slideAnim, { toValue: 0,   useNativeDriver: true, tension: 80, friction: 12 }).start();
      Animated.timing(fadeAnim,  { toValue: 1,   duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 320, duration: 220, useNativeDriver: true }).start();
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!activity) return null;

  const color   = activity.color ?? CATEGORY_COLORS[activity.category];
  const icon    = CATEGORY_ICONS[activity.category];
  const endTime = minutesToTime(timeToMinutes(activity.startTime) + activity.duration);

  return (
    <>
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.drawer, { transform: [{ translateY: slideAnim }] }]} pointerEvents={visible ? 'auto' : 'none'}>
        <View style={s.drawerHandle} />
        <TouchableOpacity style={s.drawerClose} onPress={onClose}>
          <Text style={{ color: '#55556a', fontSize: 12 }}>✕</Text>
        </TouchableOpacity>

        <View style={[s.catPill, { backgroundColor: color + '18', borderColor: color + '33' }]}>
          <Text style={[s.catPillText, { color }]}>{icon} {activity.category.toUpperCase()}</Text>
        </View>
        <Text style={s.drawerTitle}>{activity.name}</Text>
        {activity.description
          ? <Text style={s.drawerDesc}>{activity.description}</Text>
          : null}

        <View style={s.metaRow}>
          {[`⏰ ${activity.startTime}`, `⏱ ${formatDuration(activity.duration)}`, `→ ${endTime}`].map((l) => (
            <View key={l} style={s.metaPill}><Text style={s.metaPillText}>{l}</Text></View>
          ))}
          {activity.notifyBefore && activity.notifyBefore > 0
            ? <View style={s.metaPill}><Text style={s.metaPillText}>🔔 {activity.notifyBefore}m antes</Text></View>
            : null}
        </View>

        <View style={s.drawerActions}>
          <TouchableOpacity onPress={onEdit} style={[s.drawerBtn, s.drawerBtnEdit]} activeOpacity={0.8}>
            <Text style={s.drawerBtnEditText}>✏️  Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[s.drawerBtn, s.drawerBtnDelete]} activeOpacity={0.8}>
            <Text style={s.drawerBtnDeleteText}>🗑  Eliminar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScheduleScreen() {
  const { templates, updateTemplate } = useStore();
  const router                         = useRouter();
  const scrollRef                      = useRef<ScrollView>(null);
  const [activeId, setActiveId]        = useState(templates[0]?.id ?? '');
  const [selected, setSelected]        = useState<Activity | null>(null);
  const [drawerOpen, setDrawerOpen]    = useState(false);

  const activeTemplate = templates.find((t) => t.id === activeId) ?? templates[0];

  useEffect(() => {
    const y = Math.max(0, (getNowMins() - 120) * PX_PER_MIN);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 400);
  }, []);

  const handleActivityPress = useCallback((a: Activity) => {
    setSelected(a);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selected || !activeTemplate) return;
    setDrawerOpen(false);
    setTimeout(() => {
      router.push({
        pathname: '/activity/[id]',
        params: { id: selected.id, templateId: activeTemplate.id, from: 'schedule' },
      });
    }, 250);
  }, [selected, activeTemplate]);

  // ── Eliminar actividad directamente desde el drawer ────────────────────────
  const handleDeleteActivity = useCallback(() => {
    if (!selected || !activeTemplate) return;
    Alert.alert(
      'Eliminar actividad',
      `¿Eliminar "${selected.name}" del horario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setDrawerOpen(false);
            setSelected(null);
            updateTemplate({
              ...activeTemplate,
              activities: activeTemplate.activities.filter((a) => a.id !== selected.id),
              updatedAt: new Date().toISOString(),
            });
          },
        },
      ],
    );
  }, [selected, activeTemplate, updateTemplate]);

  const handleNew = useCallback(() => {
    if (!activeTemplate) return;
    router.push({
      pathname: '/activity/[id]',
      params: { id: 'new', templateId: activeTemplate.id, from: 'schedule' },
    });
  }, [activeTemplate]);

  const handleTabPress = (id: string) => {
    setActiveId(id);
    const y = Math.max(0, (getNowMins() - 120) * PX_PER_MIN);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 100);
  };

  // ── Long press en tab → editar plantilla ──────────────────────────────────
  const handleTabLongPress = useCallback((id: string) => {
    router.push({ pathname: '/template/[id]', params: { id } });
  }, []);

  const dayLabels: Record<string, string> = { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' };
  const now      = new Date();
  const todayStr = format(now, 'EEE d MMM', { locale: es }).toUpperCase();
  const daysStr  = activeTemplate?.days.map((d) => dayLabels[d]).join(' · ') ?? '';
  const pct      = (getNowMins() / 1440) * 100;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Horario</Text>
          <Text style={s.headerSub}>{todayStr} · {daysStr}</Text>
        </View>
        <TouchableOpacity onPress={handleNew} style={s.addBtn} activeOpacity={0.8}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.tabsScroll} contentContainerStyle={s.tabsContent}
      >
        {templates.map((t, i) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => handleTabPress(t.id)}
            onLongPress={() => handleTabLongPress(t.id)}
            delayLongPress={400}
            style={[s.tab, activeId === t.id && s.tabActive]}
            activeOpacity={0.7}
          >
            <View style={[s.tabDot, { backgroundColor: i === 0 ? '#7c6aff' : '#ff6a8e' }]} />
            <Text style={[s.tabText, activeId === t.id && s.tabTextActive]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.tab, { borderStyle: 'dashed', opacity: 0.6 }]}
          onPress={() => router.push({ pathname: '/template/[id]', params: { id: 'new' } })}
          activeOpacity={0.7}
        >
          <Text style={s.tabText}>+ Nueva</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Hint contextual de long press */}
      <View style={s.hintRow}>
        <Text style={s.hintText}>Mantén presionado un tab para editar la plantilla</Text>
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` as any }]} />
      </View>

      <ScrollView ref={scrollRef} style={s.scrollArea}
        contentContainerStyle={{ height: TIMELINE_H }} showsVerticalScrollIndicator={false}
      >
        <HourGrid />
        {activeTemplate?.activities.map((a, i) => (
          <ActivityBlock key={a.id} activity={a} onPress={handleActivityPress} delay={i * 25} />
        ))}
        <NowLine />
      </ScrollView>

      <ActivityDrawer
        activity={selected}
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEdit}
        onDelete={handleDeleteActivity}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0c0c0f' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  headerTitle:      { fontSize: 18, fontWeight: '600', color: '#eeeef5', letterSpacing: -0.3 },
  headerSub:        { fontFamily: MONO, fontSize: 10, color: '#55556a', marginTop: 2 },
  addBtn:           { width: 34, height: 34, borderRadius: 10, backgroundColor: '#7c6aff', alignItems: 'center', justifyContent: 'center' },
  addBtnText:       { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: '300' },
  tabsScroll:       { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  tabsContent:      { paddingHorizontal: 14, paddingVertical: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tab:              { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#26262f', backgroundColor: '#141418', flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabActive:        { backgroundColor: 'rgba(124,106,255,.12)', borderColor: '#7c6aff' },
  tabDot:           { width: 6, height: 6, borderRadius: 3 },
  tabText:          { fontFamily: MONO, fontSize: 11, color: '#55556a' },
  tabTextActive:    { color: '#7c6aff' },
  hintRow:          { paddingHorizontal: 16, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  hintText:         { fontFamily: MONO, fontSize: 9, color: '#2e2e3a' },
  progressTrack:    { height: 2, backgroundColor: '#1c1c22' },
  progressFill:     { height: 2, backgroundColor: '#7c6aff' },
  scrollArea:       { flex: 1 },
  hourLabel:        { position: 'absolute', left: 0, width: LABEL_W, textAlign: 'right', paddingRight: 8, paddingTop: 2, fontFamily: MONO, fontSize: 9, color: '#55556a' },
  hourLine:         { position: 'absolute', left: LABEL_W, right: 0, height: 1, backgroundColor: '#26262f' },
  actWrap:          { position: 'absolute', left: LABEL_W + 8, right: 14 },
  actCard:          { flex: 1, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  actAccent:        { width: 3, alignSelf: 'stretch' },
  actContent:       { flex: 1, paddingHorizontal: 10, paddingVertical: 7 },
  actName:          { fontSize: 13, fontWeight: '500' },
  actDesc:          { fontSize: 11, marginTop: 2 },
  actDur:           { paddingRight: 10, fontFamily: MONO, fontSize: 10 },
  nowLine:          { position: 'absolute', left: LABEL_W, right: 0, height: 1, backgroundColor: '#7c6aff' },
  nowDot:           { position: 'absolute', left: -4, top: -4, width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#7c6aff' },
  overlay:          { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 10 },
  drawer:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141418', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: '#26262f', padding: 20, paddingBottom: 36, zIndex: 20 },
  drawerHandle:     { width: 36, height: 3, backgroundColor: '#26262f', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
  drawerClose:      { position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  catPill:          { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1, marginBottom: 12 },
  catPillText:      { fontFamily: MONO, fontSize: 10 },
  drawerTitle:      { fontSize: 22, fontWeight: '600', color: '#eeeef5', marginBottom: 6, letterSpacing: -0.3 },
  drawerDesc:       { fontSize: 14, color: '#55556a', lineHeight: 22, marginBottom: 12 },
  metaRow:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  metaPill:         { backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  metaPillText:     { fontFamily: MONO, fontSize: 11, color: '#55556a' },
  drawerActions:    { flexDirection: 'row', gap: 10 },
  drawerBtn:        { flex: 1, borderRadius: 12, padding: 13, alignItems: 'center', borderWidth: 1 },
  drawerBtnEdit:    { backgroundColor: 'rgba(124,106,255,.12)', borderColor: 'rgba(124,106,255,.25)' },
  drawerBtnEditText:{ fontSize: 14, fontWeight: '500', color: '#7c6aff' },
  drawerBtnDelete:  { backgroundColor: 'rgba(255,106,142,.08)', borderColor: 'rgba(255,106,142,.25)' },
  drawerBtnDeleteText: { fontSize: 14, fontWeight: '500', color: '#ff6a8e' },
});
