import { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Animated, Alert, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../src/store/index';
import { Activity, ActivityCategory } from '../../src/types/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../src/constants/index';
import { uid, timeToMinutes, minutesToTime, formatDuration } from '../../src/utils/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// ─── Category data ────────────────────────────────────────────────────────────
const CATEGORIES: { id: ActivityCategory; label: string }[] = [
  { id: 'sleep',   label: 'Sleep'   },
  { id: 'wake',    label: 'Despertar' },
  { id: 'training',label: 'Training' },
  { id: 'eating',  label: 'Eating'  },
  { id: 'hygiene', label: 'Higiene' },
  { id: 'study',   label: 'Studying' },
  { id: 'break',   label: 'Break'   },
  { id: 'commute', label: 'Commuting'},
  { id: 'work',    label: 'Work'    },
  { id: 'write',   label: 'Writing' },
  { id: 'custom',  label: 'Custom'  },
];

const DUR_PRESETS = [15, 30, 60, 90, 120];

// ─── Category Selector ────────────────────────────────────────────────────────
function CategoryGrid({
  selected, onSelect,
}: { selected: ActivityCategory; onSelect: (c: ActivityCategory) => void }) {
  return (
    <View style={s.catGrid}>
      {CATEGORIES.map((cat) => {
        const color    = CATEGORY_COLORS[cat.id];
        const icon     = CATEGORY_ICONS[cat.id];
        const isActive = cat.id === selected;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => { onSelect(cat.id); Haptics.selectionAsync(); }}
            style={[
              s.catBtn,
              isActive && { borderColor: color, backgroundColor: color + '18' },
            ]}
            activeOpacity={0.7}
          >
            <Text style={s.catEmoji}>{icon}</Text>
            <Text style={[s.catLabel, isActive && { color }]}>
              {cat.label.toUpperCase().slice(0, 6)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Duration Stepper ─────────────────────────────────────────────────────────
function DurationStepper({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  const step = (d: number) => {
    const next = Math.max(5, Math.min(480, value + d));
    onChange(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  return (
    <View>
      <View style={s.durRow}>
        <TouchableOpacity onPress={() => step(-5)} style={s.durBtn} activeOpacity={0.7}>
          <Text style={s.durBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.durVal}>{formatDuration(value)}</Text>
        <TouchableOpacity onPress={() => step(5)} style={s.durBtn} activeOpacity={0.7}>
          <Text style={s.durBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={s.durPresets}>
        {DUR_PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => { onChange(p); Haptics.selectionAsync(); }}
            style={[s.durPreset, value === p && s.durPresetActive]}
            activeOpacity={0.7}
          >
            <Text style={[s.durPresetText, value === p && s.durPresetTextActive]}>
              {formatDuration(p)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Time Picker (simple +/- stepper) ────────────────────────────────────────
function TimePicker({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':').map(Number);

  const changeH = (d: number) => {
    const nh = (h + d + 24) % 24;
    onChange(`${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    Haptics.selectionAsync();
  };
  const changeM = (d: number) => {
    const nm = (m + d + 60) % 60;
    onChange(`${String(h).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
    Haptics.selectionAsync();
  };

  return (
    <View style={s.timeRow}>
      <View style={s.timeBox}>
        <TouchableOpacity onPress={() => changeH(1)} style={s.timeArrow}>
          <Text style={s.timeArrowText}>▲</Text>
        </TouchableOpacity>
        <Text style={s.timeVal}>{String(h).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => changeH(-1)} style={s.timeArrow}>
          <Text style={s.timeArrowText}>▼</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.timeSep}>:</Text>
      <View style={s.timeBox}>
        <TouchableOpacity onPress={() => changeM(15)} style={s.timeArrow}>
          <Text style={s.timeArrowText}>▲</Text>
        </TouchableOpacity>
        <Text style={s.timeVal}>{String(m).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={() => changeM(-15)} style={s.timeArrow}>
          <Text style={s.timeArrowText}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Activity Preview ─────────────────────────────────────────────────────────
function ActivityPreview({ name, category, startTime, duration }: Partial<Activity>) {
  const color   = CATEGORY_COLORS[category ?? 'study'];
  const icon    = CATEGORY_ICONS[category  ?? 'study'];
  const endMins = timeToMinutes(startTime ?? '09:00') + (duration ?? 60);
  const endTime = minutesToTime(endMins);
  return (
    <View style={[s.preview, { borderColor: color + '33', backgroundColor: color + '0d' }]}>
      <View style={[s.previewAccent, { backgroundColor: color }]} />
      <Text style={[s.previewName, { color: '#eeeef5' }]}>
        {icon} {name || 'Nueva actividad'}
      </Text>
      <Text style={[s.previewMeta, { color: color + 'aa' }]}>
        {startTime ?? '09:00'} → {endTime} · {formatDuration(duration ?? 60)}
      </Text>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ActivityModal() {
  const router = useRouter();
  const { id, templateId } = useLocalSearchParams<{ id: string; templateId: string }>();
  const { templates, updateTemplate } = useStore();

  const template  = templates.find((t) => t.id === templateId);
  const existing  = id !== 'new' ? template?.activities.find((a) => a.id === id) : null;
  const isEditing = !!existing;

  // Form state
  const [name,      setName]      = useState(existing?.name        ?? '');
  const [desc,      setDesc]      = useState(existing?.description  ?? '');
  const [category,  setCategory]  = useState<ActivityCategory>(existing?.category ?? 'study');
  const [startTime, setStartTime] = useState(existing?.startTime   ?? '09:00');
  const [duration,  setDuration]  = useState(existing?.duration    ?? 60);
  const [notify,    setNotify]    = useState((existing?.notifyBefore ?? 0) > 0);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para la actividad.');
      return;
    }
    if (!template) return;

    const activity: Activity = {
      id:           existing?.id ?? uid(),
      name:         name.trim(),
      description:  desc.trim() || undefined,
      category,
      startTime,
      duration,
      notifyBefore: notify ? 5 : 0,
    };

    const updatedActivities = isEditing
      ? template.activities.map((a) => (a.id === activity.id ? activity : a))
      : [...template.activities, activity].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
        );

    updateTemplate({ ...template, activities: updatedActivities, updatedAt: new Date().toISOString() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, desc, category, startTime, duration, notify, template, existing, isEditing]);

  const handleDelete = useCallback(() => {
    Alert.alert('Eliminar actividad', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          if (!template) return;
          updateTemplate({
            ...template,
            activities: template.activities.filter((a) => a.id !== id),
            updatedAt: new Date().toISOString(),
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  }, [name, id, template]);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>

      {/* Handle */}
      <View style={s.handle} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          {isEditing ? 'Editar actividad' : 'Nueva actividad'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Preview */}
        <ActivityPreview
          name={name} category={category}
          startTime={startTime} duration={duration}
        />

        {/* Nombre */}
        <Field label="NOMBRE">
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Estudiar Python..."
            placeholderTextColor="#55556a"
            autoFocus={!isEditing}
          />
        </Field>

        {/* Descripción */}
        <Field label="DESCRIPCIÓN">
          <TextInput
            style={[s.input, s.inputMulti]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Opcional..."
            placeholderTextColor="#55556a"
            multiline
            numberOfLines={3}
          />
        </Field>

        {/* Categoría */}
        <Field label="CATEGORÍA">
          <CategoryGrid selected={category} onSelect={setCategory} />
        </Field>

        {/* Hora inicio */}
        <Field label="HORA DE INICIO">
          <TimePicker value={startTime} onChange={setStartTime} />
        </Field>

        {/* Duración */}
        <Field label="DURACIÓN">
          <DurationStepper value={duration} onChange={setDuration} />
        </Field>

        {/* Notificación */}
        <Field label="RECORDATORIO">
          <TouchableOpacity
            onPress={() => { setNotify((v) => !v); Haptics.selectionAsync(); }}
            style={s.notifyRow}
            activeOpacity={0.8}
          >
            <View>
              <Text style={s.notifyLabel}>Notificar antes</Text>
              <Text style={s.notifySub}>{notify ? '5 min antes del inicio' : 'Desactivado'}</Text>
            </View>
            <View style={[s.toggle, notify && s.toggleOn]}>
              <View style={[s.toggleThumb, notify && s.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </Field>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity onPress={handleSave} style={s.btnSave} activeOpacity={0.85}>
            <Text style={s.btnSaveText}>✓  Guardar</Text>
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity onPress={handleDelete} style={s.btnDel} activeOpacity={0.85}>
              <Text style={s.btnDelText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#141418' },
  handle:            { width: 36, height: 3, backgroundColor: '#26262f', borderRadius: 99, alignSelf: 'center', marginTop: 12 },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  headerTitle:       { fontSize: 16, fontWeight: '600', color: '#eeeef5' },
  closeBtn:          { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:      { color: '#55556a', fontSize: 13 },
  scroll:            { flex: 1 },
  scrollContent:     { padding: 20, paddingBottom: 60 },
  field:             { marginBottom: 20 },
  fieldLabel:        { fontFamily: MONO, fontSize: 9, color: '#55556a', letterSpacing: 0.1, textTransform: 'uppercase', marginBottom: 8 },
  input:             { backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', borderRadius: 10, padding: 12, fontSize: 14, color: '#eeeef5', fontFamily: 'System' },
  inputMulti:        { height: 80, textAlignVertical: 'top' },
  // Preview
  preview:           { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20, paddingLeft: 18 },
  previewAccent:     { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  previewName:       { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  previewMeta:       { fontFamily: MONO, fontSize: 10 },
  // Category grid
  catGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catBtn:            { width: '18%', aspectRatio: 0.85, backgroundColor: '#1c1c22', borderWidth: 1.5, borderColor: '#26262f', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 3 },
  catEmoji:          { fontSize: 18 },
  catLabel:          { fontFamily: MONO, fontSize: 7, color: '#55556a', textAlign: 'center' },
  // Time picker
  timeRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBox:           { flex: 1, backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', borderRadius: 10, padding: 10, alignItems: 'center', gap: 4 },
  timeArrow:         { padding: 4 },
  timeArrowText:     { color: '#55556a', fontSize: 12 },
  timeVal:           { fontFamily: MONO, fontSize: 24, fontWeight: '700', color: '#eeeef5' },
  timeSep:           { fontFamily: MONO, fontSize: 24, fontWeight: '700', color: '#55556a' },
  // Duration
  durRow:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  durBtn:            { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  durBtnText:        { color: '#eeeef5', fontSize: 20, fontWeight: '300' },
  durVal:            { flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 20, fontWeight: '700', color: '#eeeef5' },
  durPresets:        { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  durPreset:         { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f' },
  durPresetActive:   { borderColor: '#7c6aff', backgroundColor: 'rgba(124,106,255,.08)' },
  durPresetText:     { fontFamily: MONO, fontSize: 10, color: '#55556a' },
  durPresetTextActive:{ color: '#7c6aff' },
  // Notify toggle
  notifyRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1c1c22', borderWidth: 1, borderColor: '#26262f', borderRadius: 10, padding: 14 },
  notifyLabel:       { fontSize: 13, fontWeight: '500', color: '#eeeef5' },
  notifySub:         { fontSize: 11, color: '#55556a', marginTop: 2 },
  toggle:            { width: 44, height: 26, borderRadius: 13, backgroundColor: '#26262f', justifyContent: 'center', padding: 3 },
  toggleOn:          { backgroundColor: '#7c6aff' },
  toggleThumb:       { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  toggleThumbOn:     { transform: [{ translateX: 18 }] },
  // Actions
  actions:           { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnSave:           { flex: 1, backgroundColor: '#7c6aff', borderRadius: 12, padding: 15, alignItems: 'center' },
  btnSaveText:       { fontSize: 15, fontWeight: '600', color: '#fff' },
  btnDel:            { width: 52, backgroundColor: 'transparent', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,.3)', padding: 15, alignItems: 'center' },
  btnDelText:        { fontSize: 18 },
});
