import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Animated, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../src/constants/index';
import { Activity, Task } from '../../src/types/index';
import { uid } from '../../src/utils/index';

const MONO  = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const MOODS = ['😴', '😐', '🙂', '😊', '🔥'];

function getNowMins() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
function minsToTime(m: number) { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
function timeToMins(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fmtDur(m: number) { const h = Math.floor(m / 60), mm = m % 60; if (h && mm) return `${h}h ${mm}m`; if (h) return `${h}h`; return `${mm}m`; }

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

// ─── Current Activity Card ────────────────────────────────────────────────────
function NowCard({ activity, next }: { activity: Activity; next?: Activity }) {
  const color   = activity.color ?? CATEGORY_COLORS[activity.category];
  const icon    = CATEGORY_ICONS[activity.category];
  const nowMins = getNowMins();
  const startM  = timeToMins(activity.startTime);
  const elapsed = nowMins - startM;
  const pct     = Math.min(Math.round((elapsed / activity.duration) * 100), 100);
  const endTime = minsToTime(startM + activity.duration);

  return (
    <View style={s.sectionWrap}>
      <View style={[s.nowCard, { backgroundColor: color + '0d', borderColor: color + '33' }]}>
        <View style={[s.nowAccent, { backgroundColor: color }]} />
        <Text style={[s.nowLabel, { color }]}>AHORA · {activity.startTime} → {endTime}</Text>
        <Text style={[s.nowName]}>{icon} {activity.name}</Text>
        {activity.description
          ? <Text style={s.nowDesc} numberOfLines={2}>{activity.description}</Text>
          : null}
        <View style={s.nowFooter}>
          <Text style={s.nowTime}>{fmtDur(activity.duration)}</Text>
          <View style={s.nowProgressTrack}>
            <View style={[s.nowProgressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={s.nowPct}>{pct}%</Text>
        </View>
      </View>
      {next && (
        <View style={s.nextCard}>
          <View style={[s.nextDot, { backgroundColor: next.color ?? CATEGORY_COLORS[next.category] }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.nextName}>Siguiente: {CATEGORY_ICONS[next.category]} {next.name}</Text>
            <Text style={s.nextTime}>En {fmtDur(timeToMins(next.startTime) - nowMins)} · {next.startTime}</Text>
          </View>
          <Text style={s.nextDur}>{fmtDur(next.duration)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
const PRIORITY_COLORS = { low: '#4ade80', mid: '#fbbf24', high: '#f87171' };

function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handleToggle}
        onLongPress={onDelete}
        delayLongPress={400}
        activeOpacity={0.75}
        style={[s.taskRow, task.done && s.taskRowDone]}
      >
        <View style={[s.taskCb, task.done && s.taskCbDone]}>
          {task.done && <Text style={s.taskCheck}>✓</Text>}
        </View>
        <Text style={[s.taskName, task.done && s.taskNameDone]} numberOfLines={2}>{task.name}</Text>
        {task.priority && (
          <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Habit Row ────────────────────────────────────────────────────────────────
function HabitItem({ habit, done, streak, onToggle }: {
  habit: { id: string; name: string; icon: string };
  done: boolean; streak: number; onToggle: () => void;
}) {
  const anim = useRef(new Animated.Value(done ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(done ? 1 : 0)).current;
  const bgAnim     = useRef(new Animated.Value(done ? 1 : 0)).current;

  const toggle = () => {
    onToggle();
    // FIX: separate animations instead of parallel (New Architecture)
    Animated.spring(anim,       { toValue: done ? 0 : 1, useNativeDriver: true,  tension: 120, friction: 8 }).start();
    Animated.timing(borderAnim, { toValue: done ? 0 : 1, useNativeDriver: false, duration: 200 }).start();
    Animated.timing(bgAnim,     { toValue: done ? 0 : 1, useNativeDriver: false, duration: 200 }).start();
  };

  const borderColor = borderAnim.interpolate({ inputRange: [0, 1], outputRange: ['#26262f', 'rgba(74,222,128,.5)'] });
  const bgColor     = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#141418', 'rgba(74,222,128,.06)'] });

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.75} style={{ flex: 1 }}>
      <Animated.View style={[s.habitCard, { borderColor, backgroundColor: bgColor }]}>
        <Text style={s.habitIcon}>{habit.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.habitName, done && { color: '#4ade80' }]} numberOfLines={1}>{habit.name}</Text>
          <Text style={s.habitStreak}>🔥 {done ? streak + 1 : streak}d</Text>
        </View>
        <View style={[s.habitCheck, done && s.habitCheckDone]}>
          {done ? <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>✓</Text> : null}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Timeline Preview ─────────────────────────────────────────────────────────
function TimelinePreview({ activities }: { activities: Activity[] }) {
  const now   = getNowMins();
  const items = activities.filter((a) => timeToMins(a.startTime) >= Math.max(0, now - 30)).slice(0, 7);
  return (
    <View>
      {items.map((a) => {
        const start = timeToMins(a.startTime);
        const isPast    = start + a.duration <= now;
        const isCurrent = start <= now && now < start + a.duration;
        const color = a.color ?? CATEGORY_COLORS[a.category];
        return (
          <View key={a.id} style={s.tlItem}>
            <Text style={s.tlTime}>{a.startTime}</Text>
            <View style={[s.tlDot, { backgroundColor: color }]} />
            <Text style={[s.tlName, isPast && s.tlPast, isCurrent && s.tlCurrent]} numberOfLines={1}>
              {CATEGORY_ICONS[a.category]} {a.name}
            </Text>
            <Text style={s.tlDur}>{fmtDur(a.duration)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TodayScreen() {
  const {
    habits, habitLogs, toggleHabitLog, getStreakForHabit,
    streak, getTodayTemplate, tasks, addTask, toggleTask, deleteTask,
    getGlobalProgress, journal, addJournalEntry, deleteJournalEntry,
  } = useStore();

  const router   = useRouter();
  const today    = new Date().toISOString().slice(0, 10);
  const template = getTodayTemplate();
  const nowMins  = getNowMins();

  const current = template?.activities.find((a) => {
    const sm = timeToMins(a.startTime);
    return nowMins >= sm && nowMins < sm + a.duration;
  });
  const next = template?.activities.find((a) => timeToMins(a.startTime) > nowMins);

  const doneTasks  = tasks.filter((t) => t.done).length;
  const doneHabits = habits.filter((h) => habitLogs.find((l) => l.habitId === h.id && l.date === today)?.done).length;
  const globalPct  = getGlobalProgress();

  // Pending tasks (today's focus — show all undone + today's done)
  const pendingTasks  = tasks.filter((t) => !t.done);
  const completedToday = tasks.filter((t) => t.done && t.doneAt?.slice(0, 10) === today).slice(0, 3);
  const visibleTasks  = [...pendingTasks, ...completedToday];

  // Mood — load from journal
  const todayMoodEntry = journal.find((e) => e.date === today && e.tags?.includes('mood'));
  const [mood, setMoodLocal] = useState<string | null>(
    todayMoodEntry ? MOODS[(todayMoodEntry.mood ?? 1) - 1] : null,
  );

  // Quick task input
  const [taskText, setTaskText] = useState('');

  const handleAddTask = useCallback(() => {
    if (!taskText.trim()) return;
    addTask({
      id:        `t-${uid()}`,
      name:      taskText.trim(),
      done:      false,
      createdAt: new Date().toISOString(),
    });
    setTaskText('');
  }, [taskText, addTask]);

  const handleDeleteTask = useCallback((task: Task) => {
    Alert.alert('Eliminar tarea', `¿Eliminar "${task.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteTask(task.id) },
    ]);
  }, [deleteTask]);

  // Mood — persist to journal
  const handleMood = useCallback((m: string) => {
    setMoodLocal(m);
    const moodNum = (MOODS.indexOf(m) + 1) as 1 | 2 | 3 | 4 | 5;
    if (todayMoodEntry) deleteJournalEntry(todayMoodEntry.id);
    addJournalEntry({
      id:   `mood-${today}`,
      date: today,
      text: '',
      mood: moodNum,
      tags: ['mood'],
    });
  }, [today, todayMoodEntry, addJournalEntry, deleteJournalEntry]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const dateStr  = format(now, "EEE · d MMM yyyy", { locale: es }).toUpperCase();
  const templateDayNames: Record<string, string> = { mon:'Lun',tue:'Mar',wed:'Mié',thu:'Jue',fri:'Vie',sat:'Sáb',sun:'Dom' };

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.dateStr}>{dateStr}</Text>
          <Text style={s.greeting}>{greeting}, Miguel 👋</Text>
        </View>
        <View style={s.streakBadge}>
          <Text style={s.streakNum}>{streak}</Text>
          <Text style={s.streakLbl}>días 🔥</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <StatCard label="TAREAS"  value={`${doneTasks}/${tasks.length}`} color="#60a5fa" sub="completadas" />
          <StatCard label="HÁBITOS" value={`${doneHabits}/${habits.length}`} color="#4ade80" sub="de hoy" />
          <StatCard label="RUTA"    value={`${globalPct}%`}                  color="#a78bfa" sub="global" />
        </View>

        {/* ── Current activity ── */}
        {current ? (
          <>
            <View style={s.secRow}><Text style={s.secLabel}>Ahora mismo</Text></View>
            <NowCard activity={current} next={next} />
          </>
        ) : null}

        {/* ── Tasks ── */}
        <View style={[s.secRow, { marginTop: 20 }]}>
          <Text style={s.secLabel}>Tareas · mantén para eliminar</Text>
          <Text style={s.secCount}>{pendingTasks.length} pendientes</Text>
        </View>
        <View style={s.sectionWrap}>
          {/* Quick add */}
          <View style={s.taskInputRow}>
            <TextInput
              value={taskText}
              onChangeText={setTaskText}
              placeholder="Nueva tarea..."
              placeholderTextColor="#55556a"
              style={s.taskInput}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleAddTask} style={s.taskAddBtn} activeOpacity={0.8}>
              <Text style={s.taskAddTxt}>+</Text>
            </TouchableOpacity>
          </View>
          {/* Task list */}
          {visibleTasks.length > 0 ? (
            <View style={s.taskList}>
              {visibleTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onDelete={() => handleDeleteTask(task)}
                />
              ))}
            </View>
          ) : (
            <View style={s.emptyTasks}>
              <Text style={s.emptyTasksTxt}>Sin tareas pendientes ✓</Text>
            </View>
          )}
        </View>

        {/* ── Habits ── */}
        <View style={[s.secRow, { marginTop: 20 }]}>
          <Text style={s.secLabel}>Hábitos de hoy</Text>
          <Text style={s.secCount}>{doneHabits}/{habits.length}</Text>
        </View>
        <View style={s.sectionWrap}>
          <View style={s.habitsGrid}>
            {habits.map((h) => {
              const done = habitLogs.find((l) => l.habitId === h.id && l.date === today)?.done ?? false;
              return (
                <HabitItem
                  key={h.id} habit={h} done={done}
                  streak={getStreakForHabit(h.id)}
                  onToggle={() => toggleHabitLog(h.id, today)}
                />
              );
            })}
          </View>
        </View>

        {/* ── Mood ── */}
        <View style={[s.secRow, { marginTop: 20 }]}>
          <Text style={s.secLabel}>¿Cómo te sientes?</Text>
          {mood && <Text style={s.moodSaved}>Guardado ✓</Text>}
        </View>
        <View style={s.sectionWrap}>
          <View style={s.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m} onPress={() => handleMood(m)}
                style={[s.moodBtn, mood === m && s.moodBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 22 }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Schedule preview ── */}
        {template && (
          <>
            <View style={[s.secRow, { marginTop: 20 }]}>
              <Text style={s.secLabel}>
                {template.name} · {template.days.map((d) => templateDayNames[d]).join(' · ')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
                <Text style={s.secAction}>VER TODO →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.sectionWrap}>
              <TimelinePreview activities={template.activities} />
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0c0c0f' },
  header:           { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  dateStr:          { fontFamily: MONO, fontSize: 10, color: '#55556a', letterSpacing: 0.6, marginBottom: 3 },
  greeting:         { fontSize: 20, fontWeight: '600', color: '#eeeef5', letterSpacing: -0.3 },
  streakBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,.25)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  streakNum:        { fontFamily: MONO, fontSize: 16, fontWeight: '700', color: '#fbbf24' },
  streakLbl:        { fontSize: 11, color: 'rgba(251,191,36,.7)' },
  scroll:           { flex: 1 },
  statsRow:         { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  statCard:         { flex: 1, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 12, padding: 12 },
  statLabel:        { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.8, marginBottom: 5 },
  statVal:          { fontFamily: MONO, fontSize: 22, fontWeight: '600' },
  statSub:          { fontSize: 10, color: '#55556a', marginTop: 3 },
  secRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  secLabel:         { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.12, textTransform: 'uppercase' },
  secAction:        { fontFamily: MONO, fontSize: 9, color: '#7c6aff' },
  secCount:         { fontFamily: MONO, fontSize: 9, color: '#55556a' },
  sectionWrap:      { paddingHorizontal: 20 },
  // Now card
  nowCard:          { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 8 },
  nowAccent:        { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  nowLabel:         { fontFamily: MONO, fontSize: 9, letterSpacing: 0.1, marginBottom: 8, color: '#55556a' },
  nowName:          { fontSize: 18, fontWeight: '600', color: '#eeeef5', marginBottom: 4 },
  nowDesc:          { fontSize: 12, color: '#55556a', lineHeight: 18, marginBottom: 10 },
  nowFooter:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nowTime:          { fontFamily: MONO, fontSize: 11, color: '#55556a' },
  nowProgressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 2, overflow: 'hidden' },
  nowProgressFill:  { height: 3, borderRadius: 2 },
  nowPct:           { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  nextCard:         { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextDot:          { width: 8, height: 8, borderRadius: 4 },
  nextName:         { fontSize: 13, fontWeight: '500', color: '#eeeef5' },
  nextTime:         { fontFamily: MONO, fontSize: 10, color: '#55556a', marginTop: 2 },
  nextDur:          { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  // Tasks
  taskInputRow:     { flexDirection: 'row', gap: 8, marginBottom: 8 },
  taskInput:        { flex: 1, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#eeeef5', fontSize: 13 },
  taskAddBtn:       { width: 42, height: 42, borderRadius: 12, backgroundColor: '#7c6aff', alignItems: 'center', justifyContent: 'center' },
  taskAddTxt:       { color: '#fff', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  taskList:         { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 14, overflow: 'hidden' },
  taskRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  taskRowDone:      { opacity: 0.5 },
  taskCb:           { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  taskCbDone:       { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  taskCheck:        { color: '#000', fontSize: 10, fontWeight: '700' },
  taskName:         { flex: 1, fontSize: 13, color: '#eeeef5' },
  taskNameDone:     { textDecorationLine: 'line-through', color: '#55556a' },
  priorityDot:      { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  emptyTasks:       { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyTasksTxt:    { fontFamily: MONO, fontSize: 11, color: '#55556a' },
  // Habits
  habitsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habitCard:        { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: '47%' },
  habitIcon:        { fontSize: 20 },
  habitName:        { fontSize: 12, fontWeight: '500', color: '#eeeef5' },
  habitStreak:      { fontFamily: MONO, fontSize: 10, color: '#55556a', marginTop: 2 },
  habitCheck:       { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  habitCheckDone:   { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  // Mood
  moodRow:          { flexDirection: 'row', gap: 8 },
  moodBtn:          { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, borderColor: '#26262f', backgroundColor: '#141418', alignItems: 'center', justifyContent: 'center' },
  moodBtnActive:    { borderColor: '#7c6aff', backgroundColor: 'rgba(124,106,255,.1)' },
  moodSaved:        { fontFamily: MONO, fontSize: 9, color: '#4ade80' },
  // Timeline
  tlItem:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  tlTime:           { fontFamily: MONO, fontSize: 10, color: '#55556a', width: 40 },
  tlDot:            { width: 7, height: 7, borderRadius: 3.5 },
  tlName:           { flex: 1, fontSize: 12, color: '#eeeef5' },
  tlPast:           { color: '#55556a', textDecorationLine: 'line-through' },
  tlCurrent:        { fontWeight: '600' },
  tlDur:            { fontFamily: MONO, fontSize: 10, color: '#55556a' },
});
