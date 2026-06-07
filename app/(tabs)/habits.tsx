import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '../../src/store/index';
import { Habit } from '../../src/types/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const WEEK_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function dKey(d: Date) { return d.toISOString().slice(0, 10); }
function today() { return dKey(new Date()); }

// ─── Mini progress dot (last 7 days per habit) ───────────────────────────────
function Last7Dots({ habitId, color }: { habitId: string; color: string }) {
  const { habitLogs } = useStore();
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return habitLogs.find((l) => l.habitId === habitId && l.date === dKey(d))?.done ?? false;
  });
  return (
    <View style={s.dotsRow}>
      {dots.map((filled, i) => (
        <View key={i} style={[s.miniDot, { backgroundColor: filled ? color + 'cc' : '#1c1c22' }]} />
      ))}
    </View>
  );
}

// ─── Week Day Strip ───────────────────────────────────────────────────────────
function WeekStrip() {
  const { habits, habitLogs } = useStore();
  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const td = today();

  return (
    <View style={s.weekStrip}>
      {/* Day circles */}
      <View style={s.weekDays}>
        {days.map((d, i) => {
          const dk = dKey(d);
          const isToday = dk === td;
          const doneCnt = habits.filter((h) =>
            habitLogs.find((l) => l.habitId === h.id && l.date === dk)?.done,
          ).length;
          const allDone = doneCnt === habits.length && habits.length > 0;
          const hasDone = doneCnt > 0;

          return (
            <View key={i} style={s.wdayCol}>
              <Text style={s.wdayLbl}>{WEEK_LABELS[d.getDay()]}</Text>
              <View style={[
                s.wdayCircle,
                isToday && s.wdayToday,
                allDone && s.wdayAllDone,
                !allDone && hasDone && s.wdayHasDone,
              ]}>
                <Text style={[
                  s.wdayNum,
                  isToday && { color: '#7c6aff' },
                  (allDone || hasDone) && !isToday && { color: '#4ade80' },
                ]}>
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Bar chart */}
      <View style={s.barsRow}>
        {days.map((d, i) => {
          const dk = dKey(d);
          const doneCnt = habits.filter((h) =>
            habitLogs.find((l) => l.habitId === h.id && l.date === dk)?.done,
          ).length;
          const pct = habits.length > 0 ? doneCnt / habits.length : 0;
          const isToday = dKey(d) === td;
          return (
            <View key={i} style={s.barWrap}>
              <View style={s.barTrack}>
                <View style={[
                  s.barFill,
                  {
                    height: `${Math.round(pct * 100)}%` as any,
                    backgroundColor: isToday ? '#7c6aff' : pct > 0 ? 'rgba(124,106,255,.4)' : '#1c1c22',
                  },
                ]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────
function HabitCard({ habit }: { habit: Habit }) {
  const { habitLogs, toggleHabitLog, getStreakForHabit } = useStore();
  const td   = today();
  const done = habitLogs.find((l) => l.habitId === habit.id && l.date === td)?.done ?? false;
  const streak = getStreakForHabit(habit.id);
  const color  = habit.color ?? '#7c6aff';

  const borderAnim = useRef(new Animated.Value(done ? 1 : 0)).current;
  const bgAnim     = useRef(new Animated.Value(done ? 1 : 0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const handleToggle = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
    Animated.timing(borderAnim, { toValue: done ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    Animated.timing(bgAnim,     { toValue: done ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    toggleHabitLog(habit.id, td);
  }, [done, habit.id, td]);

  const animBorder = borderAnim.interpolate({
    inputRange: [0, 1], outputRange: ['#26262f', color + '66'],
  });
  const animBg = bgAnim.interpolate({
    inputRange: [0, 1], outputRange: ['#141418', color + '08'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginHorizontal: 20, marginBottom: 8 }}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.85}>
        <Animated.View style={[s.habitCard, { borderColor: animBorder, backgroundColor: animBg }]}>
          {/* Icon */}
          <View style={s.habitIconWrap}>
            <Text style={s.habitIcon}>{habit.icon}</Text>
          </View>

          {/* Body */}
          <View style={s.habitBody}>
            <Text style={[s.habitName, done && { color: '#4ade80' }]} numberOfLines={1}>
              {habit.name}
            </Text>
            <View style={s.habitMeta}>
              <Text style={s.habitStreak}>🔥 {streak}d racha</Text>
              <Last7Dots habitId={habit.id} color={color} />
            </View>
          </View>

          {/* Right */}
          <View style={s.habitRight}>
            <View style={[s.habitCb, done && { backgroundColor: '#4ade80', borderColor: '#4ade80' }]}>
              {done && <Text style={{ color: '#000', fontSize: 11, fontWeight: '700' }}>✓</Text>}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const { habits, habitLogs, getStreakForHabit } = useStore();
  const td = today();

  const doneTodayCount = habits.filter((h) =>
    habitLogs.find((l) => l.habitId === h.id && l.date === td)?.done,
  ).length;

  const last7Pct = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dk = dKey(d);
    const done = habits.filter((h) =>
      habitLogs.find((l) => l.habitId === h.id && l.date === dk)?.done,
    ).length;
    return habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  });
  const weekAvg = Math.round(last7Pct.reduce((a, b) => a + b, 0) / last7Pct.length);
  const bestStreak = Math.max(0, ...habits.map((h) => getStreakForHabit(h.id)));
  const globalStreak = Math.max(0, bestStreak);

  const now = new Date();
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const days   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const hdrSub = `${days[now.getDay()].toUpperCase()} ${now.getDate()} ${months[now.getMonth()].toUpperCase()} · ${habits.length} HÁBITOS`;

  return (
    <SafeAreaView style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Hábitos</Text>
          <Text style={s.headerSub}>{hdrSub}</Text>
        </View>
        <View style={s.streakChip}>
          <Text style={s.streakNum}>{globalStreak}</Text>
          <Text style={s.streakLbl}>días 🔥</Text>
        </View>
      </View>

      {/* ── Week strip + bars ── */}
      <WeekStrip />

      {/* ── Stats row ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>HOY</Text>
          <Text style={[s.statVal, { color: '#4ade80' }]}>{doneTodayCount}/{habits.length}</Text>
          <Text style={s.statSub}>completados</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>SEMANA</Text>
          <Text style={[s.statVal, { color: '#7c6aff' }]}>{weekAvg}%</Text>
          <Text style={s.statSub}>tasa semanal</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>MEJOR</Text>
          <Text style={[s.statVal, { color: '#fbbf24' }]}>{bestStreak}d</Text>
          <Text style={s.statSub}>racha máx</Text>
        </View>
      </View>

      {/* ── Habits list ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.secLabel}>HOY</Text>
        {habits.map((h) => <HabitCard key={h.id} habit={h} />)}

        {/* Add habit button */}
        <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
          <Text style={s.addBtnText}>＋  Nuevo hábito</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0c0c0f' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: '#eeeef5', letterSpacing: -0.3 },
  headerSub:    { fontFamily: MONO, fontSize: 10, color: '#55556a', marginTop: 2 },
  streakChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(251,191,36,.08)', borderWidth: 1, borderColor: 'rgba(251,191,36,.2)', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 6 },
  streakNum:    { fontFamily: MONO, fontSize: 18, fontWeight: '700', color: '#fbbf24' },
  streakLbl:    { fontSize: 11, color: 'rgba(251,191,36,.65)' },

  // Week strip
  weekStrip:    { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  weekDays:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  wdayCol:      { alignItems: 'center', gap: 5 },
  wdayLbl:      { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.06 },
  wdayCircle:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#26262f' },
  wdayToday:    { borderColor: '#7c6aff', backgroundColor: 'rgba(124,106,255,.1)' },
  wdayAllDone:  { borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,.15)' },
  wdayHasDone:  { borderColor: 'rgba(74,222,128,.4)', backgroundColor: 'rgba(74,222,128,.06)' },
  wdayNum:      { fontFamily: MONO, fontSize: 11, color: '#55556a' },

  // Bar chart
  barsRow:      { flexDirection: 'row', alignItems: 'flex-end', height: 36, gap: 4 },
  barWrap:      { flex: 1, height: '100%' },
  barTrack:     { flex: 1, backgroundColor: '#1c1c22', borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:      { width: '100%', borderRadius: 3 },

  // Stats
  statsRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  statCard:     { flex: 1, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 12, padding: 10 },
  statLabel:    { fontFamily: MONO, fontSize: 8, color: '#55556a', letterSpacing: 0.1, marginBottom: 4 },
  statVal:      { fontFamily: MONO, fontSize: 20, fontWeight: '700' },
  statSub:      { fontSize: 10, color: '#55556a', marginTop: 3 },

  scroll:       { flex: 1 },
  secLabel:     { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, textTransform: 'uppercase' },

  // Habit card
  habitCard:    { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitIconWrap:{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#1c1c22', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  habitIcon:    { fontSize: 20 },
  habitBody:    { flex: 1, minWidth: 0 },
  habitName:    { fontSize: 13, fontWeight: '500', color: '#eeeef5' },
  habitMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  habitStreak:  { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  dotsRow:      { flexDirection: 'row', gap: 3 },
  miniDot:      { width: 5, height: 5, borderRadius: 2.5 },
  habitRight:   { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  habitCb:      { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },

  // Add button
  addBtn:       { marginHorizontal: 20, marginTop: 4, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#26262f', padding: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText:   { fontSize: 13, fontWeight: '500', color: '#55556a' },
});
