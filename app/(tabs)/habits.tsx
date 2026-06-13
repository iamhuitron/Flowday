import { useRef, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/index';
import { useTheme } from '../../src/hooks/useTheme';
import { haptic } from '../../src/utils/haptics';
import { Habit } from '../../src/types/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function dKey(d: Date) { return d.toISOString().slice(0, 10); }
function today()       { return dKey(new Date()); }

function useHabitStats(habitId: string, days = 30) {
  const { habitLogs } = useStore();
  return Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    return { date: dKey(d), done: habitLogs.find((l) => l.habitId === habitId && l.date === dKey(d))?.done ?? false };
  });
}

// ─── 7-day dots ───────────────────────────────────────────────────────────────
function Last7Dots({ habitId, color }: { habitId: string; color: string }) {
  const data = useHabitStats(habitId, 7);
  return (
    <View style={s.dotsRow}>
      {data.map(({ date, done }) => (
        <View key={date} style={[s.miniDot, { backgroundColor: done ? color+'cc' : '#1c1c22' }]} />
      ))}
    </View>
  );
}

// ─── 35-day Heatmap ───────────────────────────────────────────────────────────
function MonthHeatmap({ accent }: { accent: string }) {
  const { habits, habitLogs } = useStore();
  const days = Array.from({ length: 35 }, (_, i) => {
    const d  = subDays(new Date(), 34 - i);
    const dk = dKey(d);
    const done = habits.filter((h) => habitLogs.find((l) => l.habitId === h.id && l.date === dk)?.done).length;
    const pct  = habits.length > 0 ? done / habits.length : 0;
    return { dk, pct, isFuture: d > new Date(), isToday: dk === today() };
  });

  function cellColor(pct: number, isFuture: boolean, isToday: boolean) {
    if (isFuture)  return '#0f0f11';
    if (isToday)   return pct > 0 ? `${accent}${Math.round(0.25 + pct * 0.75 * 255).toString(16).padStart(2,'0')}` : accent+'2e';
    if (pct === 0) return '#1c1c22';
    if (pct < 0.4) return 'rgba(74,222,128,.25)';
    if (pct < 0.7) return 'rgba(74,222,128,.55)';
    return 'rgba(74,222,128,.90)';
  }

  return (
    <View style={s.heatmapWrap}>
      <Text style={s.heatmapTitle}>ÚLTIMOS 35 DÍAS</Text>
      <View style={s.heatmapGrid}>
        {days.map(({ dk, pct, isFuture, isToday }) => (
          <View key={dk} style={[s.heatCell, { backgroundColor: cellColor(pct, isFuture, isToday) },
            isToday && { borderWidth: 1, borderColor: accent }]} />
        ))}
      </View>
      <View style={s.heatLegend}>
        <Text style={s.heatLegendTxt}>Ninguno</Text>
        {['rgba(74,222,128,.25)','rgba(74,222,128,.55)','rgba(74,222,128,.90)'].map((c) => (
          <View key={c} style={[s.heatCell, { backgroundColor: c, marginHorizontal: 2 }]} />
        ))}
        <Text style={s.heatLegendTxt}>Todos</Text>
      </View>
    </View>
  );
}

// ─── Stats Drawer ─────────────────────────────────────────────────────────────
function HabitStatsDrawer({ habit, visible, onClose, onEdit }:
  { habit: Habit|null; visible: boolean; onClose: ()=>void; onEdit: ()=>void }) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const data      = useHabitStats(habit?.id ?? '', 28);
  const color     = habit?.color ?? '#7c6aff';
  const doneCount = data.filter((d) => d.done).length;
  const rate      = Math.round((doneCount / data.length) * 100);
  const maxBar    = 36;

  if (visible) {
    Animated.spring(slideAnim, { toValue:0, useNativeDriver:true, tension:70, friction:12 }).start();
    Animated.timing(fadeAnim,  { toValue:1, duration:180, useNativeDriver:true }).start();
  } else {
    Animated.timing(slideAnim, { toValue:500, duration:220, useNativeDriver:true }).start();
    Animated.timing(fadeAnim,  { toValue:0,   duration:180, useNativeDriver:true }).start();
  }

  if (!habit) return null;

  return (
    <>
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]} pointerEvents={visible?'auto':'none'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.statsDrawer, { transform:[{ translateY: slideAnim }] }]} pointerEvents={visible?'auto':'none'}>
        <View style={s.drawerHandle} />
        <TouchableOpacity style={s.drawerClose} onPress={onClose}>
          <Text style={{ color:'#55556a', fontSize:12 }}>✕</Text>
        </TouchableOpacity>
        <View style={s.statsHeader}>
          <View style={[s.statsIconWrap, { backgroundColor: color+'18' }]}>
            <Text style={{ fontSize:26 }}>{habit.icon}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.statsHabitName}>{habit.name}</Text>
            <Text style={s.statsHabitDays}>
              {habit.targetDays.length===7 ? 'Todos los días'
                : habit.targetDays.map((d) => ({mon:'Lun',tue:'Mar',wed:'Mié',thu:'Jue',fri:'Vie',sat:'Sáb',sun:'Dom'}[d])).join(' · ')}
            </Text>
          </View>
          <TouchableOpacity onPress={onEdit} style={[s.editHabitBtn, { borderColor:color+'44', backgroundColor:color+'10' }]}>
            <Text style={[s.editHabitTxt, { color }]}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.statsKpis}>
          {[
            { label:'28 DÍAS', value:`${rate}%`, color },
            { label:'COMPLETADOS', value:String(doneCount), color:'#4ade80' },
            { label:'PENDIENTES',  value:String(28-doneCount), color:'#55556a' },
          ].map(({ label, value, color: c }) => (
            <View key={label} style={s.kpiCard}>
              <Text style={[s.kpiVal, { color:c }]}>{value}</Text>
              <Text style={s.kpiLbl}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={s.chartTitle}>ÚLTIMOS 28 DÍAS</Text>
        <View style={s.barChart}>
          {data.map(({ date, done }) => (
            <View key={date} style={s.barCol}>
              <View style={[s.barFill, { height: done ? maxBar : 4, backgroundColor: done ? color : '#1c1c22' }]} />
            </View>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────
function HabitCard({ habit, onLongPress, onStats }:
  { habit: Habit; onLongPress: ()=>void; onStats: ()=>void }) {
  const { habitLogs, toggleHabitLog, getStreakForHabit } = useStore();
  const td     = today();
  const done   = habitLogs.find((l) => l.habitId===habit.id && l.date===td)?.done ?? false;
  const streak = getStreakForHabit(habit.id);
  const color  = habit.color ?? '#7c6aff';
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(done?1:0)).current;
  const bgAnim     = useRef(new Animated.Value(done?1:0)).current;

  const handleToggle = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue:0.96, useNativeDriver:true, tension:200, friction:10 }),
      Animated.spring(scaleAnim, { toValue:1,    useNativeDriver:true, tension:200, friction:10 }),
    ]).start();
    Animated.timing(borderAnim, { toValue:done?0:1, duration:200, useNativeDriver:false }).start();
    Animated.timing(bgAnim,     { toValue:done?0:1, duration:200, useNativeDriver:false }).start();
    done ? haptic.light() : haptic.success();
    toggleHabitLog(habit.id, td);
  }, [done, habit.id, td]);

  const animBorder = borderAnim.interpolate({ inputRange:[0,1], outputRange:['#26262f', color+'66'] });
  const animBg     = bgAnim.interpolate({ inputRange:[0,1], outputRange:['#141418', color+'08'] });

  return (
    <Animated.View style={{ transform:[{ scale:scaleAnim }], marginHorizontal:20, marginBottom:8 }}>
      <TouchableOpacity onPress={handleToggle}
        onLongPress={() => { haptic.heavy(); onLongPress(); }}
        delayLongPress={400} activeOpacity={0.85}
      >
        <Animated.View style={[s.habitCard, { borderColor:animBorder, backgroundColor:animBg }]}>
          <View style={s.habitIconWrap}><Text style={s.habitIcon}>{habit.icon}</Text></View>
          <View style={s.habitBody}>
            <Text style={[s.habitName, done&&{ color:'#4ade80' }]} numberOfLines={1}>{habit.name}</Text>
            <View style={s.habitMeta}>
              <Text style={s.habitStreak}>🔥 {streak}d</Text>
              <Last7Dots habitId={habit.id} color={color} />
            </View>
          </View>
          <View style={s.habitRight}>
            <TouchableOpacity onPress={onStats} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Text style={s.statsBtn}>📊</Text>
            </TouchableOpacity>
            <View style={[s.habitCb, done&&{ backgroundColor:'#4ade80', borderColor:'#4ade80' }]}>
              {done && <Text style={{ color:'#000', fontSize:11, fontWeight:'700' }}>✓</Text>}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Week strip ───────────────────────────────────────────────────────────────
const WEEK_LABELS = ['D','L','M','X','J','V','S'];

function WeekStrip({ accent }: { accent: string }) {
  const { habits, habitLogs } = useStore();
  const days = Array.from({ length:7 }, (_, i) => subDays(new Date(), 6-i));
  const td   = today();

  return (
    <View style={s.weekStrip}>
      <View style={s.weekDays}>
        {days.map((d, i) => {
          const dk      = dKey(d);
          const isToday = dk === td;
          const done    = habits.filter((h) => habitLogs.find((l) => l.habitId===h.id&&l.date===dk)?.done).length;
          const allDone = done===habits.length && habits.length>0;
          const hasDone = done > 0;
          return (
            <View key={i} style={s.wdayCol}>
              <Text style={[s.wdayLbl, isToday&&{ color:accent }]}>{WEEK_LABELS[d.getDay()]}</Text>
              <View style={[s.wdayCircle,
                isToday && { borderColor:accent, backgroundColor:accent+'18' },
                allDone && { borderColor:'#4ade80', backgroundColor:'rgba(74,222,128,.15)' },
                !allDone&&hasDone && { borderColor:'rgba(74,222,128,.4)', backgroundColor:'rgba(74,222,128,.06)' }
              ]}>
                <Text style={[s.wdayNum,
                  isToday&&{ color:accent },
                  (allDone||hasDone)&&!isToday&&{ color:'#4ade80' }
                ]}>{d.getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={s.barsRow}>
        {days.map((d, i) => {
          const dk  = dKey(d);
          const done = habits.filter((h) => habitLogs.find((l) => l.habitId===h.id&&l.date===dk)?.done).length;
          const pct  = habits.length > 0 ? done / habits.length : 0;
          return (
            <View key={i} style={s.barWrap}>
              <View style={s.barTrackWeek}>
                <View style={[s.barFillWeek, {
                  height: `${Math.round(pct*100)}%` as any,
                  backgroundColor: dk===td ? accent : pct>0 ? accent+'66' : '#1c1c22',
                }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HabitsScreen() {
  const { habits, habitLogs, getStreakForHabit, deleteHabit } = useStore();
  const { accent } = useTheme();
  const router     = useRouter();

  const [view,          setView]          = useState<'week'|'month'>('week');
  const [selectedHabit, setSelectedHabit] = useState<Habit|null>(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);

  const td             = today();
  const doneTodayCount = habits.filter((h) => habitLogs.find((l) => l.habitId===h.id&&l.date===td)?.done).length;
  const last7Pct       = Array.from({ length:7 }, (_, i) => {
    const dk   = dKey(subDays(new Date(), 6-i));
    const done = habits.filter((h) => habitLogs.find((l) => l.habitId===h.id&&l.date===dk)?.done).length;
    return habits.length > 0 ? Math.round((done/habits.length)*100) : 0;
  });
  const weekAvg    = Math.round(last7Pct.reduce((a,b)=>a+b,0)/7);
  const bestStreak = Math.max(0, ...habits.map((h) => getStreakForHabit(h.id)));

  const now      = new Date();
  const months   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const hdrSub   = `${dayNames[now.getDay()].toUpperCase()} ${now.getDate()} ${months[now.getMonth()].toUpperCase()} · ${habits.length} HÁBITOS`;

  const handleLongPress = useCallback((habit: Habit) => {
    Alert.alert(habit.name, '', [
      { text:'✏️  Editar',  onPress: () => router.push({ pathname:'/habit/[id]', params:{ id:habit.id } }) },
      { text:'🗑  Eliminar', style:'destructive',
        onPress: () => Alert.alert('Eliminar hábito', `¿Eliminar "${habit.name}" y su historial?`, [
          { text:'Cancelar', style:'cancel' },
          { text:'Eliminar', style:'destructive', onPress: () => { haptic.error(); deleteHabit(habit.id); } },
        ]),
      },
      { text:'Cancelar', style:'cancel' },
    ]);
  }, [router, deleteHabit]);

  const handleStats = useCallback((habit: Habit) => {
    setSelectedHabit(habit); setDrawerOpen(true);
  }, []);

  const handleViewToggle = (v: 'week'|'month') => {
    haptic.selection();
    setView(v);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Hábitos</Text>
          <Text style={s.headerSub}>{hdrSub}</Text>
        </View>
        <View style={[s.streakChip, { backgroundColor:'rgba(251,191,36,.08)', borderColor:'rgba(251,191,36,.2)' }]}>
          <Text style={s.streakNum}>{bestStreak}</Text>
          <Text style={s.streakLbl}>días 🔥</Text>
        </View>
      </View>

      {/* View toggle */}
      <View style={s.viewToggle}>
        {(['week','month'] as const).map((v) => (
          <TouchableOpacity key={v} onPress={() => handleViewToggle(v)}
            style={[s.viewBtn, view===v && { backgroundColor: accent+'12', borderColor: accent }]}
          >
            <Text style={[s.viewBtnTxt, view===v && { color: accent }]}>
              {v==='week' ? 'Semana' : '35 días'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      {view==='week' ? <WeekStrip accent={accent}/> : <MonthHeatmap accent={accent}/>}

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>HOY</Text>
          <Text style={[s.statVal, { color:'#4ade80' }]}>{doneTodayCount}/{habits.length}</Text>
          <Text style={s.statSub}>completados</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>SEMANA</Text>
          <Text style={[s.statVal, { color: accent }]}>{weekAvg}%</Text>
          <Text style={s.statSub}>tasa promedio</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>MEJOR RACHA</Text>
          <Text style={[s.statVal, { color:'#fbbf24' }]}>{bestStreak}d</Text>
          <Text style={s.statSub}>máximo actual</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom:100 }} showsVerticalScrollIndicator={false}>
        <Text style={s.secLabel}>HOY · mantén presionado para editar</Text>
        {habits.map((h) => (
          <HabitCard key={h.id} habit={h}
            onLongPress={() => handleLongPress(h)}
            onStats={() => handleStats(h)}
          />
        ))}
        <TouchableOpacity style={s.addBtn} activeOpacity={0.7}
          onPress={() => { haptic.light(); router.push({ pathname:'/habit/[id]', params:{ id:'new' } }); }}
        >
          <Text style={[s.addBtnText, { color: accent }]}>＋  Nuevo hábito</Text>
        </TouchableOpacity>
      </ScrollView>

      <HabitStatsDrawer habit={selectedHabit} visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={() => { setDrawerOpen(false); if(selectedHabit) router.push({ pathname:'/habit/[id]', params:{ id:selectedHabit.id } }); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#0c0c0f' },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingTop:16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:'#26262f' },
  headerTitle:    { fontSize:18, fontWeight:'600', color:'#eeeef5', letterSpacing:-0.3 },
  headerSub:      { fontFamily:MONO, fontSize:10, color:'#55556a', marginTop:2 },
  streakChip:     { flexDirection:'row', alignItems:'center', gap:5, borderWidth:1, borderRadius:99, paddingHorizontal:13, paddingVertical:6 },
  streakNum:      { fontFamily:MONO, fontSize:18, fontWeight:'700', color:'#fbbf24' },
  streakLbl:      { fontSize:11, color:'rgba(251,191,36,.65)' },
  viewToggle:     { flexDirection:'row', paddingHorizontal:20, paddingVertical:10, gap:8, borderBottomWidth:1, borderBottomColor:'#26262f' },
  viewBtn:        { paddingHorizontal:14, paddingVertical:6, borderRadius:99, backgroundColor:'#141418', borderWidth:1, borderColor:'#26262f' },
  viewBtnTxt:     { fontFamily:MONO, fontSize:11, color:'#55556a' },
  weekStrip:      { paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:'#26262f' },
  weekDays:       { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  wdayCol:        { alignItems:'center', gap:5 },
  wdayLbl:        { fontFamily:MONO, fontSize:9, color:'#55556a' },
  wdayCircle:     { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#26262f' },
  wdayNum:        { fontFamily:MONO, fontSize:11, color:'#55556a' },
  barsRow:        { flexDirection:'row', alignItems:'flex-end', height:36, gap:4 },
  barWrap:        { flex:1, height:'100%' },
  barTrackWeek:   { flex:1, backgroundColor:'#1c1c22', borderRadius:3, overflow:'hidden', justifyContent:'flex-end' },
  barFillWeek:    { width:'100%', borderRadius:3 },
  heatmapWrap:    { paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:'#26262f' },
  heatmapTitle:   { fontFamily:MONO, fontSize:9, color:'#55556a', marginBottom:10 },
  heatmapGrid:    { flexDirection:'row', flexWrap:'wrap', gap:4 },
  heatCell:       { width:16, height:16, borderRadius:3 },
  heatLegend:     { flexDirection:'row', alignItems:'center', gap:4, marginTop:8 },
  heatLegendTxt:  { fontFamily:MONO, fontSize:9, color:'#55556a' },
  statsRow:       { flexDirection:'row', gap:8, paddingHorizontal:20, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#26262f' },
  statCard:       { flex:1, backgroundColor:'#141418', borderWidth:1, borderColor:'#26262f', borderRadius:12, padding:10 },
  statLabel:      { fontFamily:MONO, fontSize:8, color:'#55556a', letterSpacing:0.1, marginBottom:4 },
  statVal:        { fontFamily:MONO, fontSize:20, fontWeight:'700' },
  statSub:        { fontSize:10, color:'#55556a', marginTop:3 },
  scroll:         { flex:1 },
  secLabel:       { fontFamily:MONO, fontSize:9, color:'#55556a', letterSpacing:0.12, paddingHorizontal:20, paddingTop:14, paddingBottom:8 },
  habitCard:      { borderRadius:14, borderWidth:1, padding:14, flexDirection:'row', alignItems:'center', gap:12 },
  habitIconWrap:  { width:38, height:38, borderRadius:10, backgroundColor:'#1c1c22', alignItems:'center', justifyContent:'center', flexShrink:0 },
  habitIcon:      { fontSize:20 },
  habitBody:      { flex:1, minWidth:0 },
  habitName:      { fontSize:13, fontWeight:'500', color:'#eeeef5' },
  habitMeta:      { flexDirection:'row', alignItems:'center', gap:8, marginTop:4 },
  habitStreak:    { fontFamily:MONO, fontSize:10, color:'#55556a' },
  dotsRow:        { flexDirection:'row', gap:3 },
  miniDot:        { width:5, height:5, borderRadius:2.5 },
  habitRight:     { alignItems:'center', gap:8, flexShrink:0 },
  statsBtn:       { fontSize:16 },
  habitCb:        { width:22, height:22, borderRadius:6, borderWidth:1.5, borderColor:'#26262f', alignItems:'center', justifyContent:'center' },
  addBtn:         { marginHorizontal:20, marginTop:4, borderRadius:14, borderWidth:1.5, borderStyle:'dashed', borderColor:'#26262f', padding:14, alignItems:'center' },
  addBtnText:     { fontSize:13, fontWeight:'500' },
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor:'#000', zIndex:10 },
  statsDrawer:    { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#141418', borderTopLeftRadius:22, borderTopRightRadius:22, borderTopWidth:1, borderTopColor:'#26262f', padding:20, paddingBottom:40, zIndex:20 },
  drawerHandle:   { width:36, height:3, backgroundColor:'#26262f', borderRadius:99, alignSelf:'center', marginBottom:16 },
  drawerClose:    { position:'absolute', top:16, right:16, width:28, height:28, borderRadius:14, backgroundColor:'#1c1c22', borderWidth:1, borderColor:'#26262f', alignItems:'center', justifyContent:'center' },
  statsHeader:    { flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
  statsIconWrap:  { width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  statsHabitName: { fontSize:18, fontWeight:'600', color:'#eeeef5' },
  statsHabitDays: { fontFamily:MONO, fontSize:10, color:'#55556a', marginTop:2 },
  editHabitBtn:   { paddingHorizontal:12, paddingVertical:6, borderRadius:8, borderWidth:1 },
  editHabitTxt:   { fontSize:12, fontWeight:'500' },
  statsKpis:      { flexDirection:'row', gap:8, marginBottom:16 },
  kpiCard:        { flex:1, backgroundColor:'#1c1c22', borderRadius:10, padding:10, alignItems:'center' },
  kpiVal:         { fontFamily:MONO, fontSize:22, fontWeight:'700' },
  kpiLbl:         { fontFamily:MONO, fontSize:8, color:'#55556a', marginTop:3 },
  chartTitle:     { fontFamily:MONO, fontSize:9, color:'#55556a', marginBottom:8 },
  barChart:       { flexDirection:'row', alignItems:'flex-end', height:44, gap:2 },
  barCol:         { flex:1, height:'100%', justifyContent:'flex-end' },
  barFill:        { width:'100%', borderRadius:2, minHeight:4 },
});
