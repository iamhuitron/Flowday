import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/index';

const { width: SCREEN_W } = Dimensions.get('window');
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const ACCENT_OPTIONS = [
  { color: '#7c6aff', label: 'Índigo'  },
  { color: '#ff6a8e', label: 'Rosa'    },
  { color: '#4ade80', label: 'Verde'   },
  { color: '#fbbf24', label: 'Ámbar'   },
  { color: '#60a5fa', label: 'Azul'    },
  { color: '#f97316', label: 'Naranja' },
];

const STREAK_OPTIONS = [3, 5, 7, 14, 21, 30];

const FEATURES = [
  { icon: '📅', title: 'Horario inteligente',   desc: 'Bloques de tiempo con recordatorios automáticos para cada actividad de tu día.' },
  { icon: '🔥', title: 'Racha de hábitos',       desc: 'Registra hábitos diarios y mantén rachas. Visualiza tu consistencia en 35 días.' },
  { icon: '🎯', title: 'Ruta de carrera',        desc: '5 fases hacia tu primer trabajo tech internacional, con objetivos concretos por semestre.' },
  { icon: '📖', title: 'Diario personal',        desc: 'Estado de ánimo diario, notas y etiquetas. Historial visual de las últimas 2 semanas.' },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────
function Steps({ current, total, accent }: { current: number; total: number; accent: string }) {
  return (
    <View style={s.steps}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            s.step,
            i === current
              ? { backgroundColor: accent, width: 20 }
              : i < current
              ? { backgroundColor: accent + '66' }
              : { backgroundColor: '#26262f' },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { updateSettings } = useStore();

  const [step,        setStep]        = useState(0);
  const [name,        setName]        = useState('');
  const [accent,      setAccent]      = useState('#7c6aff');
  const [streakGoal,  setStreakGoal]  = useState(7);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleComplete = () => {
    updateSettings({
      hasOnboarded:        true,
      userName:            name.trim() || 'Tú',
      accentColor:         accent,
      streakGoal,
    });
    router.replace('/(tabs)');
  };

  // ── Step 0: Welcome ────────────────────────────────────────────────────────
  const Step0 = (
    <View style={s.stepContent}>
      <View style={[s.logoWrap, { backgroundColor: accent + '18', borderColor: accent + '33' }]}>
        <Text style={s.logoEmoji}>⚡</Text>
      </View>
      <Text style={s.bigTitle}>FlowDay</Text>
      <Text style={[s.tagline, { color: accent }]}>Tu día. Tu ritmo.</Text>
      <Text style={s.welcomeDesc}>
        Organiza tu horario, mantén hábitos y avanza en tu ruta de carrera — todo en un solo lugar.
      </Text>
      <View style={s.versionBadge}>
        <Text style={s.versionTxt}>v0.1.0 · por iamhuitron</Text>
      </View>
    </View>
  );

  // ── Step 1: Features ───────────────────────────────────────────────────────
  const Step1 = (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>¿Qué puedes hacer?</Text>
      <Text style={s.stepSub}>FlowDay combina 4 herramientas en una app.</Text>
      <View style={s.featureList}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[s.featureRow, { borderColor: accent + '22' }]}>
            <View style={[s.featureIcon, { backgroundColor: accent + '15' }]}>
              <Text style={{ fontSize: 22 }}>{f.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Step 2: Setup ──────────────────────────────────────────────────────────
  const Step2 = (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Personaliza tu app</Text>
      <Text style={s.stepSub}>Puedes cambiar esto después en Ajustes.</Text>

      {/* Name */}
      <Text style={s.fieldLabel}>¿CÓMO TE LLAMAS?</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Tu nombre"
        placeholderTextColor="#55556a"
        style={[s.nameInput, { borderColor: name ? accent + '66' : '#26262f' }]}
        maxLength={24}
        autoFocus={false}
      />

      {/* Accent color */}
      <Text style={s.fieldLabel}>COLOR DE ACENTO</Text>
      <View style={s.colorRow}>
        {ACCENT_OPTIONS.map(({ color, label }) => (
          <TouchableOpacity
            key={color} onPress={() => setAccent(color)}
            style={[s.colorOption, { backgroundColor: color + '18', borderColor: color + (accent === color ? 'ff' : '33') }]}
            activeOpacity={0.7}
          >
            <View style={[s.colorDot, { backgroundColor: color }]}>
              {accent === color && <Text style={s.colorCheck}>✓</Text>}
            </View>
            <Text style={[s.colorLabel, { color: accent === color ? color : '#55556a' }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Streak goal */}
      <Text style={s.fieldLabel}>META DE RACHA DIARIA</Text>
      <View style={s.streakRow}>
        {STREAK_OPTIONS.map((v) => (
          <TouchableOpacity
            key={v} onPress={() => setStreakGoal(v)}
            style={[
              s.streakPill,
              streakGoal === v && { backgroundColor: accent + '18', borderColor: accent },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[s.streakPillTxt, streakGoal === v && { color: accent }]}>
              {v}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const steps = [Step0, Step1, Step2];
  const isLast = step === steps.length - 1;

  return (
    <SafeAreaView style={s.container}>
      {/* Progress */}
      <View style={s.header}>
        <Steps current={step} total={steps.length} accent={accent} />
        {step > 0 && (
          <TouchableOpacity onPress={() => goTo(step - 1)} style={s.backBtn}>
            <Text style={s.backTxt}>‹ Atrás</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        {steps[step]}
      </Animated.View>

      {/* CTA */}
      <View style={s.footer}>
        <TouchableOpacity
          onPress={isLast ? handleComplete : () => goTo(step + 1)}
          style={[s.ctaBtn, { backgroundColor: accent }]}
          activeOpacity={0.85}
        >
          <Text style={s.ctaTxt}>
            {isLast ? '¡Empezar FlowDay →' : 'Continuar →'}
          </Text>
        </TouchableOpacity>
        {!isLast && (
          <TouchableOpacity onPress={handleComplete} style={s.skipBtn}>
            <Text style={s.skipTxt}>Saltar configuración</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0c0c0f' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  steps:        { flexDirection: 'row', gap: 6, alignItems: 'center' },
  step:         { height: 4, width: 10, borderRadius: 99 },
  backBtn:      { padding: 4 },
  backTxt:      { fontFamily: MONO, fontSize: 11, color: '#55556a' },
  content:      { flex: 1, paddingHorizontal: 24 },
  stepContent:  { flex: 1, justifyContent: 'center' },
  // Step 0
  logoWrap:     { width: 80, height: 80, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center' },
  logoEmoji:    { fontSize: 40 },
  bigTitle:     { fontSize: 42, fontWeight: '700', color: '#eeeef5', textAlign: 'center', letterSpacing: -1.5, marginBottom: 8 },
  tagline:      { fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  welcomeDesc:  { fontSize: 15, color: '#6b6b7e', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8, marginBottom: 24 },
  versionBadge: { alignSelf: 'center', backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  versionTxt:   { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  // Step 1
  stepTitle:    { fontSize: 26, fontWeight: '700', color: '#eeeef5', letterSpacing: -0.5, marginBottom: 6 },
  stepSub:      { fontSize: 14, color: '#6b6b7e', marginBottom: 24, lineHeight: 22 },
  featureList:  { gap: 12 },
  featureRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#141418', borderWidth: 1, borderRadius: 14, padding: 14 },
  featureIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#eeeef5', marginBottom: 4 },
  featureDesc:  { fontSize: 12, color: '#6b6b7e', lineHeight: 18 },
  // Step 2
  fieldLabel:   { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.12, marginBottom: 10, marginTop: 18 },
  nameInput:    { backgroundColor: '#141418', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: '#eeeef5', fontSize: 16, marginBottom: 4 },
  colorRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption:  { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  colorDot:     { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  colorCheck:   { color: '#fff', fontSize: 10, fontWeight: '700' },
  colorLabel:   { fontFamily: MONO, fontSize: 10 },
  streakRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  streakPill:   { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: '#26262f', backgroundColor: '#141418' },
  streakPillTxt:{ fontFamily: MONO, fontSize: 12, color: '#55556a' },
  // Footer
  footer:       { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },
  ctaBtn:       { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaTxt:       { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  skipBtn:      { alignItems: 'center', padding: 4 },
  skipTxt:      { fontFamily: MONO, fontSize: 10, color: '#55556a' },
});
