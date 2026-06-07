import { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Animated, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const PHASES = [
  { id: '0', name: 'F1 · Fundamentos',    color: '#60a5fa', sem: 'Sem 2–3 · ~6 meses',
    milestone: 'Repositorio GitHub con 3+ proyectos y área elegida',
    objectives: [
      'Completar CS50P de Harvard (Python)',
      'Resolver 30 ejercicios en LeetCode nivel Easy',
      'Crear cuenta y subir primer proyecto a GitHub',
      'Construir script de automatización personal',
      'Ver 2h/semana de YouTube tech en inglés',
      'Probar web: HTML/CSS/JS básico',
      'Probar datos: Kaggle Intro to ML',
      'Probar seguridad: TryHackMe Pre-Security',
      'Elegir área de especialización',
    ] },
  { id: '1', name: 'F2 · Especialización', color: '#4ade80', sem: 'Sem 3–4 · ~6 meses',
    milestone: 'Primer proyecto serio publicado, inglés fluido para leer/escribir',
    objectives: [
      'Completar curso React (Scrimba o freeCodeCamp)',
      'Aprender Node.js + Express básico',
      'Completar NumPy y Pandas fundamentals',
      'Completar curso ML Andrew Ng (Coursera)',
      'Terminar TryHackMe SOC Level 1',
      'Publicar proyecto con base de datos en línea',
      'Subir primer proyecto serio a GitHub',
      'Primera competencia Kaggle completada',
      'Leer documentación técnica solo en inglés',
    ] },
  { id: '2', name: 'F3 · Certificación',   color: '#fbbf24', sem: 'Sem 4–5 · ~6 meses',
    milestone: '1 cert cloud, ingreso freelance, práctica profesional',
    objectives: [
      'Obtener AWS Cloud Practitioner',
      'Completar Google Cloud Skills Boost (5 insignias)',
      'Primer proyecto freelance pagado',
      'Aplicar a prácticas profesionales',
      'Contribuir a proyecto open source en GitHub',
      'Iniciar inglés conversacional (Italki/Cambly)',
      'LinkedIn con perfil técnico completo',
    ] },
  { id: '3', name: 'F4 · Junior',           color: '#a78bfa', sem: 'Sem 5–7 · ~1 año',
    milestone: 'Primer trabajo formal, 2+ certs, portafolio sólido',
    objectives: [
      'Dominar TypeScript (o stack de tu área)',
      'Docker y despliegue en producción',
      'Segunda certificación cloud (Associate level)',
      'Escribir 5 artículos técnicos publicados',
      'GitHub con commits diarios por 3+ meses',
      'Primer trabajo de tiempo parcial en tech',
      'Inglés conversacional en entrevistas técnicas',
    ] },
  { id: '4', name: 'F5 · Internacional',    color: '#f87171', sem: 'Sem 8–9 · último año',
    milestone: 'Posición junior–mid con sueldo competitivo, opción internacional real',
    objectives: [
      'Aplicar a plataformas nearshore (Toptal, Turing)',
      'AWS Solutions Architect Associate o equivalente',
      'Inglés fluido en reuniones técnicas',
      'Portafolio con 8+ proyectos documentados',
      'Investigar posgrado/intercambio UNAM',
      'Primera entrevista técnica en inglés completada',
    ] },
];

// ─── Filter tabs ──────────────────────────────────────────────────────────────
function FilterTabs({
  active, onChange,
}: { active: number; onChange: (i: number) => void }) {
  const tabs = ['Todas', 'F1', 'F2', 'F3', 'F4', 'F5'];
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      style={s.tabsScroll} contentContainerStyle={s.tabsContent}
    >
      {tabs.map((label, i) => (
        <TouchableOpacity
          key={label}
          onPress={() => onChange(i - 1)}
          style={[s.ftab, active === i - 1 && s.ftabActive]}
          activeOpacity={0.7}
        >
          <Text style={[s.ftabText, active === i - 1 && s.ftabTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Phase Card ───────────────────────────────────────────────────────────────
function PhaseCard({
  phase, phaseIndex, expanded, onToggleExpand,
}: {
  phase: typeof PHASES[0];
  phaseIndex: number;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const { objectives, toggleObjective } = useStore();
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const handleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(chevronAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onToggleExpand();
  };

  const done  = phase.objectives.filter((_, i) => objectives[`${phaseIndex}-${i}`]).length;
  const total = phase.objectives.length;
  const pct   = Math.round((done / total) * 100);
  const isComplete = pct === 100;

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={[s.phaseCard, expanded && { borderColor: phase.color + '55' }]}>

      {/* Header */}
      <TouchableOpacity onPress={handleExpand} activeOpacity={0.8} style={s.phaseHeader}>
        <View style={[s.phaseDot, { backgroundColor: phase.color }]} />
        <View style={s.phaseInfo}>
          <Text style={s.phaseName}>{phase.name}</Text>
          <Text style={s.phaseSem}>{phase.sem}</Text>
        </View>
        <View style={s.phasePctWrap}>
          <Text style={[s.phasePct, { color: phase.color }]}>{pct}%</Text>
          <Text style={s.phaseDoneLbl}>{done}/{total}</Text>
        </View>
        <Animated.Text style={[s.phaseChevron, { transform: [{ rotate: chevronRotate }] }]}>
          ›
        </Animated.Text>
      </TouchableOpacity>

      {/* Phase progress bar */}
      <View style={s.phaseBarTrack}>
        <View style={[s.phaseBarFill, { width: `${pct}%` as any, backgroundColor: phase.color }]} />
      </View>

      {/* Objectives (expanded) */}
      {expanded && (
        <View>
          <View style={s.objList}>
            {phase.objectives.map((obj, oi) => {
              const key  = `${phaseIndex}-${oi}`;
              const done = objectives[key] ?? false;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => toggleObjective(key)}
                  style={s.objRow}
                  activeOpacity={0.7}
                >
                  <View style={[
                    s.objCb,
                    done && { backgroundColor: phase.color, borderColor: phase.color },
                  ]}>
                    {done && <Text style={s.objCheck}>✓</Text>}
                  </View>
                  <Text style={[s.objText, done && s.objTextDone]} numberOfLines={3}>
                    {obj}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Milestone or complete badge */}
          {isComplete ? (
            <View style={[s.completeBadge, { borderColor: phase.color + '33', backgroundColor: phase.color + '0a' }]}>
              <Text style={[s.completeBadgeText, { color: phase.color }]}>🎉 Fase completada</Text>
            </View>
          ) : (
            <View style={[s.milestone, { borderLeftColor: phase.color }]}>
              <Text style={s.milestoneIcon}>🎯</Text>
              <Text style={s.milestoneText}>{phase.milestone}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const { objectives, getGlobalProgress } = useStore();
  const [filter, setFilter]     = useState(-1);          // -1 = all
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const scrollRef = useRef<ScrollView>(null);

  const globalPct = getGlobalProgress();

  const handleFilter = (i: number) => {
    setFilter(i);
    if (i >= 0) {
      setExpanded(new Set([i]));
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: i * 148, animated: true });
      }, 100);
    }
  };

  const handleToggleExpand = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const visiblePhases = filter >= 0 ? [[filter, PHASES[filter]]] : PHASES.map((p, i) => [i, p]);

  const totalObjs = PHASES.reduce((a, p) => a + p.objectives.length, 0);
  const doneObjs  = Object.values(objectives).filter(Boolean).length;

  return (
    <SafeAreaView style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Metas</Text>
          <Text style={s.headerSub}>RUTA DE {PHASES.length} FASES · {doneObjs}/{totalObjs} OBJETIVOS</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.headerPct}>{globalPct}%</Text>
          <Text style={s.headerPctSub}>progreso global</Text>
        </View>
      </View>

      {/* Global progress bar */}
      <View style={s.globalBarTrack}>
        <View style={[s.globalBarFill, { width: `${globalPct}%` as any }]} />
      </View>

      {/* Filter tabs */}
      <FilterTabs active={filter} onChange={handleFilter} />

      {/* Phase cards */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(visiblePhases as [number, typeof PHASES[0]][]).map(([pi, phase]) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            phaseIndex={pi}
            expanded={expanded.has(pi)}
            onToggleExpand={() => handleToggleExpand(pi)}
          />
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0c0c0f' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  headerTitle:     { fontSize: 18, fontWeight: '600', color: '#eeeef5', letterSpacing: -0.3 },
  headerSub:       { fontFamily: MONO, fontSize: 9, color: '#55556a', marginTop: 2, letterSpacing: 0.06 },
  headerRight:     { alignItems: 'flex-end' },
  headerPct:       { fontFamily: MONO, fontSize: 20, fontWeight: '700', color: '#7c6aff' },
  headerPctSub:    { fontFamily: MONO, fontSize: 9, color: '#55556a', marginTop: 2 },
  globalBarTrack:  { height: 3, backgroundColor: '#1c1c22' },
  globalBarFill:   { height: 3, backgroundColor: '#7c6aff' },
  // Filter tabs
  tabsScroll:      { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  tabsContent:     { paddingHorizontal: 14, paddingVertical: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  ftab:            { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: '#26262f', backgroundColor: '#141418' },
  ftabActive:      { backgroundColor: 'rgba(124,106,255,.08)', borderColor: '#7c6aff' },
  ftabText:        { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  ftabTextActive:  { color: '#7c6aff' },
  // Scroll
  scroll:          { flex: 1 },
  scrollContent:   { padding: 12, paddingBottom: 100 },
  // Phase card
  phaseCard:       { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  phaseHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  phaseDot:        { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  phaseInfo:       { flex: 1 },
  phaseName:       { fontSize: 14, fontWeight: '500', color: '#eeeef5', marginBottom: 2 },
  phaseSem:        { fontFamily: MONO, fontSize: 9, color: '#55556a' },
  phasePctWrap:    { alignItems: 'flex-end' },
  phasePct:        { fontFamily: MONO, fontSize: 14, fontWeight: '700' },
  phaseDoneLbl:    { fontFamily: MONO, fontSize: 9, color: '#55556a', marginTop: 2 },
  phaseChevron:    { fontSize: 18, color: '#55556a', width: 16, textAlign: 'center' },
  phaseBarTrack:   { height: 2, backgroundColor: '#1c1c22', marginHorizontal: 16 },
  phaseBarFill:    { height: 2, borderRadius: 1 },
  // Objectives
  objList:         { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  objRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  objCb:           { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  objCheck:        { color: '#000', fontSize: 10, fontWeight: '700' },
  objText:         { fontSize: 12, color: '#eeeef5', lineHeight: 18, flex: 1 },
  objTextDone:     { color: '#55556a', textDecorationLine: 'line-through' },
  // Milestone
  milestone:       { margin: 12, marginTop: 4, padding: 12, backgroundColor: '#1c1c22', borderRadius: 10, borderLeftWidth: 3, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  milestoneIcon:   { fontSize: 14 },
  milestoneText:   { fontSize: 12, color: '#55556a', lineHeight: 18, flex: 1 },
  // Complete badge
  completeBadge:   { margin: 12, marginTop: 4, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  completeBadgeText:{ fontFamily: MONO, fontSize: 11, fontWeight: '700' },
});
