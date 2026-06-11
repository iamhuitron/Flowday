import { useState } from 'react';
import {
  Alert, ScrollView, Text, TextInput,
  TouchableOpacity, View, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@store/index';
import { Habit, DayOfWeek } from '@types/index';
import { uid } from '@utils/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const ICONS = [
  '💪','🏋️','🧘','🏃','🚴','🎯','📚','✍️','💻','🎸',
  '🎨','🌱','💊','💧','🍎','🥗','☕','🌅','🌙','💤',
  '🧹','💡','📖','🔥','⚡','🌟','🎵','🧠','💰','🤸',
  '🎤','🧗','🏊','⚽','🎮','📷','🔬','🎭','🐍','💾',
];

const COLORS = [
  '#7c6aff','#ff6a8e','#4ade80','#fbbf24',
  '#60a5fa','#f97316','#a78bfa','#22d3ee',
  '#fb7185','#34d399',
];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: 'Lun' }, { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mié' }, { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' }, { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
];

function readParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
}

export default function HabitEditorScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ id?: string }>();
  const routeId = readParam(params.id);

  const { habits, addHabit, updateHabit, deleteHabit } = useStore();
  const existing = habits.find((h) => h.id === routeId);
  const isNew    = !existing;

  const [name,       setName]       = useState(existing?.name ?? '');
  const [icon,       setIcon]       = useState(existing?.icon ?? '🎯');
  const [color,      setColor]      = useState(existing?.color ?? '#7c6aff');
  const [targetDays, setTargetDays] = useState<DayOfWeek[]>(
    existing?.targetDays ?? ['mon','tue','wed','thu','fri'],
  );

  const toggleDay = (d: DayOfWeek) =>
    setTargetDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Dale un nombre a este hábito.');
      return;
    }
    if (targetDays.length === 0) {
      Alert.alert('Días requeridos', 'Selecciona al menos un día.');
      return;
    }
    const habit: Habit = {
      id:          existing?.id ?? `h-${uid()}`,
      name:        name.trim(),
      icon,
      color,
      targetDays,
      createdAt:   existing?.createdAt ?? new Date().toISOString(),
    };
    isNew ? addHabit(habit) : updateHabit(habit);
    router.replace('/(tabs)/habits');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      `Se eliminará "${existing?.name}" y todo su historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => { deleteHabit(routeId); router.replace('/(tabs)/habits'); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/habits')} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>{isNew ? 'Nuevo hábito' : 'Editar hábito'}</Text>
        <TouchableOpacity onPress={save} style={s.saveBtn}>
          <Text style={s.saveTxt}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Preview */}
        <View style={[s.preview, { backgroundColor: color + '12', borderColor: color + '33' }]}>
          <Text style={s.previewIcon}>{icon}</Text>
          <View>
            <Text style={[s.previewName, { color }]}>{name.trim() || 'Mi hábito'}</Text>
            <Text style={s.previewDays}>
              {targetDays.length === 7 ? 'Todos los días' : targetDays.map((d) => DAYS.find((x) => x.key === d)?.label).join(' · ')}
            </Text>
          </View>
        </View>

        {/* Nombre */}
        <Text style={s.label}>NOMBRE</Text>
        <TextInput
          value={name} onChangeText={setName}
          placeholder="Ej. Leer 30 min"
          placeholderTextColor="#6b6b7e"
          style={s.input}
        />

        {/* Ícono */}
        <Text style={s.label}>ÍCONO</Text>
        <View style={s.iconGrid}>
          {ICONS.map((ic) => (
            <TouchableOpacity
              key={ic} onPress={() => setIcon(ic)}
              style={[s.iconCell, icon === ic && { backgroundColor: color + '25', borderColor: color }]}
            >
              <Text style={s.iconEmoji}>{ic}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Color */}
        <Text style={s.label}>COLOR</Text>
        <View style={s.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c} onPress={() => setColor(c)}
              style={[s.colorDot, { backgroundColor: c }, color === c && s.colorSelected]}
            >
              {color === c && <Text style={s.colorCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Días */}
        <Text style={s.label}>DÍAS</Text>
        <View style={s.daysRow}>
          {DAYS.map(({ key, label }) => {
            const active = targetDays.includes(key);
            return (
              <TouchableOpacity
                key={key} onPress={() => toggleDay(key)}
                style={[s.dayPill, active && { backgroundColor: color + '18', borderColor: color }]}
              >
                <Text style={[s.dayTxt, active && { color }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selects rápidos */}
        <View style={s.quickRow}>
          {[
            { label: 'Todos', days: ['mon','tue','wed','thu','fri','sat','sun'] as DayOfWeek[] },
            { label: 'L–V',   days: ['mon','tue','wed','thu','fri'] as DayOfWeek[] },
            { label: 'F. de S.', days: ['sat','sun'] as DayOfWeek[] },
          ].map(({ label, days }) => (
            <TouchableOpacity
              key={label} onPress={() => setTargetDays(days)}
              style={s.quickPill}
            >
              <Text style={s.quickTxt}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Delete */}
        {!isNew && (
          <TouchableOpacity onPress={confirmDelete} style={s.deleteBtn}>
            <Text style={s.deleteTxt}>Eliminar hábito</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0f0f11' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2e2e38' },
  backBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1a1a1f', borderWidth: 1, borderColor: '#2e2e38', alignItems: 'center', justifyContent: 'center' },
  backText:      { color: '#e8e8f0', fontSize: 20 },
  title:         { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#e8e8f0' },
  saveBtn:       { backgroundColor: '#7c6aff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveTxt:       { color: '#fff', fontSize: 13, fontWeight: '600' },
  body:          { padding: 20, paddingBottom: 60 },
  preview:       { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  previewIcon:   { fontSize: 32 },
  previewName:   { fontSize: 18, fontWeight: '600' },
  previewDays:   { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 10, color: '#6b6b7e', marginTop: 2 },
  label:         { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 9, color: '#6b6b7e', letterSpacing: 0.12, marginBottom: 10, marginTop: 4 },
  input:         { backgroundColor: '#1a1a1f', borderWidth: 1, borderColor: '#2e2e38', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#e8e8f0', fontSize: 15, marginBottom: 20 },
  iconGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  iconCell:      { width: 44, height: 44, borderRadius: 10, backgroundColor: '#1a1a1f', borderWidth: 1, borderColor: '#2e2e38', alignItems: 'center', justifyContent: 'center' },
  iconEmoji:     { fontSize: 22 },
  colorRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorDot:      { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  colorCheck:    { color: '#fff', fontSize: 12, fontWeight: '700' },
  daysRow:       { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dayPill:       { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1a1a1f', borderWidth: 1, borderColor: '#2e2e38', alignItems: 'center' },
  dayTxt:        { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 10, color: '#6b6b7e' },
  quickRow:      { flexDirection: 'row', gap: 8, marginBottom: 24 },
  quickPill:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#1a1a1f', borderWidth: 1, borderColor: '#2e2e38' },
  quickTxt:      { fontSize: 12, color: '#6b6b7e' },
  deleteBtn:     { marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,106,142,.35)', borderRadius: 12, padding: 14, alignItems: 'center' },
  deleteTxt:     { color: '#ff6a8e', fontSize: 14, fontWeight: '500' },
});
