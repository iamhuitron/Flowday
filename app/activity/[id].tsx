import { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@constants/index';
import { useStore } from '@store/index';
import { Activity, ActivityCategory } from '@types/index';
import { formatDuration, timeToMinutes, uid } from '@utils/index';

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  sleep:    'Dormir',
  wake:     'Despertar',
  training: 'Ejercicio',
  eating:   'Comida',
  hygiene:  'Higiene',
  study:    'Estudio',
  break:    'Descanso',
  commute:  'Traslado',
  work:     'Trabajo',
  write:    'Escribir',
  custom:   'Libre',
};

const CATEGORY_OPTIONS  = Object.keys(CATEGORY_LABELS) as ActivityCategory[];
const DURATION_PRESETS  = [20, 30, 40, 60, 90, 120, 180];
const TIME_PATTERN      = /^([01]\d|2[0-3]):[0-5]\d$/;
const NOTIFY_PRESETS    = [5, 10, 15, 30];

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function sortActivities(activities: Activity[]) {
  return [...activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export default function ActivityEditorScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ id?: string; templateId?: string; from?: string }>();
  const routeId         = readParam(params.id);
  const routeTemplateId = readParam(params.templateId);
  const from            = readParam(params.from); // 'schedule' | 'template' | ''

  const { templates, updateTemplate } = useStore();

  const template = templates.find((item) => item.id === routeTemplateId)
    ?? templates.find((item) => item.activities.some((activity) => activity.id === routeId));
  const existingActivity = template?.activities.find((activity) => activity.id === routeId);

  const [activityId]    = useState(() => existingActivity?.id ?? `activity-${uid()}`);
  const [name, setName] = useState(existingActivity?.name ?? '');
  const [description, setDescription] = useState(existingActivity?.description ?? '');
  const [category, setCategory]       = useState<ActivityCategory>(existingActivity?.category ?? 'study');
  const [startTime, setStartTime]     = useState(existingActivity?.startTime ?? '09:00');
  const [duration, setDuration]       = useState(String(existingActivity?.duration ?? 60));
  const [notifyBefore, setNotifyBefore] = useState(
    existingActivity?.notifyBefore ? String(existingActivity.notifyBefore) : '',
  );

  const durationNumber        = Number(duration);
  const selectedColor         = CATEGORY_COLORS[category];
  const isExistingActivity    = Boolean(existingActivity);

  // ── Navegar de vuelta al origen correcto ───────────────────────────────────
  function goBack() {
    if (from === 'schedule') {
      router.replace('/(tabs)/schedule');
    } else if (template) {
      router.replace(`/template/${template.id}`);
    } else {
      router.back();
    }
  }

  const saveActivity = () => {
    if (!template) {
      Alert.alert('Plantilla no encontrada', 'Vuelve al horario y elige una plantilla válida.');
      return;
    }

    const cleanName          = name.trim();
    const cleanDescription   = description.trim();
    const cleanNotifyBefore  = notifyBefore.trim();
    const parsedDuration     = Number(duration);
    const parsedNotifyBefore = cleanNotifyBefore ? Number(cleanNotifyBefore) : undefined;

    if (!cleanName) {
      Alert.alert('Nombre requerido', 'Dale un nombre a la actividad.');
      return;
    }
    if (!TIME_PATTERN.test(startTime)) {
      Alert.alert('Hora inválida', 'Usa el formato HH:mm, por ejemplo 07:30.');
      return;
    }
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      Alert.alert('Duración inválida', 'La duración debe ser mayor a 0 minutos.');
      return;
    }
    if (parsedNotifyBefore !== undefined && (!Number.isFinite(parsedNotifyBefore) || parsedNotifyBefore < 0)) {
      Alert.alert('Recordatorio inválido', 'El recordatorio debe ser 0 o más minutos.');
      return;
    }

    const nextActivity: Activity = {
      id: activityId,
      name: cleanName,
      description: cleanDescription || undefined,
      category,
      startTime,
      duration: parsedDuration,
      notifyBefore: parsedNotifyBefore,
    };

    const nextActivities = isExistingActivity
      ? template.activities.map((activity) => (activity.id === existingActivity?.id ? nextActivity : activity))
      : [...template.activities, nextActivity];

    updateTemplate({
      ...template,
      activities: sortActivities(nextActivities),
      updatedAt: new Date().toISOString(),
    });

    goBack();
  };

  const confirmDelete = () => {
    if (!template || !existingActivity) return;
    Alert.alert(
      'Eliminar actividad',
      `Se eliminará "${existingActivity.name}" del horario.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            updateTemplate({
              ...template,
              activities: template.activities.filter((activity) => activity.id !== existingActivity.id),
              updatedAt: new Date().toISOString(),
            });
            goBack();
          },
        },
      ],
    );
  };

  if (!template) {
    return (
      <SafeAreaView className="flex-1 bg-[#0f0f11] items-center justify-center px-6">
        <Text className="text-[#e8e8f0] text-lg font-semibold mb-2">Plantilla no encontrada</Text>
        <Text className="text-[#6b6b7e] text-sm text-center mb-5">
          Regresa al horario y selecciona la plantilla donde quieres editar actividades.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/schedule')}
          className="bg-[#7c6aff] px-4 py-3 rounded-lg"
        >
          <Text className="text-white text-sm font-medium">Volver al horario</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      {/* Header */}
      <View className="px-5 pt-3 pb-3 border-b border-[#2e2e38] flex-row items-center gap-3">
        <TouchableOpacity
          onPress={goBack}
          className="w-10 h-10 rounded-lg bg-[#1a1a1f] border border-[#2e2e38] items-center justify-center"
        >
          <Text className="text-[#e8e8f0] text-xl">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[#6b6b7e] text-[10px] font-mono tracking-widest">{template.name}</Text>
          <Text className="text-[#e8e8f0] text-lg font-semibold">
            {isExistingActivity ? 'Editar actividad' : 'Nueva actividad'}
          </Text>
        </View>
        <TouchableOpacity onPress={saveActivity} className="bg-[#7c6aff] px-4 py-2.5 rounded-lg">
          <Text className="text-white text-sm font-medium">Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Preview */}
        <View
          className="border rounded-xl p-4 mb-5"
          style={{ backgroundColor: `${selectedColor}12`, borderColor: `${selectedColor}33` }}
        >
          <Text className="text-[#6b6b7e] text-xs font-mono mb-1">PREVIEW</Text>
          <Text className="text-[#e8e8f0] text-lg font-semibold">
            {CATEGORY_ICONS[category]} {name.trim() || 'Actividad'}
          </Text>
          <Text className="text-[#6b6b7e] text-xs mt-1">
            {startTime} · {Number.isFinite(durationNumber) && durationNumber > 0
              ? formatDuration(durationNumber)
              : 'duración pendiente'}
          </Text>
        </View>

        {/* Nombre */}
        <FieldLabel label="Nombre" />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej. Universidad"
          placeholderTextColor="#6b6b7e"
          className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl px-4 py-3 text-[#e8e8f0] text-base mb-5"
        />

        {/* Descripción */}
        <FieldLabel label="Descripción" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Notas, intención o preparación"
          placeholderTextColor="#6b6b7e"
          multiline
          className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl px-4 py-3 text-[#e8e8f0] text-sm min-h-[84px] mb-5"
          textAlignVertical="top"
        />

        {/* Categoría */}
        <FieldLabel label="Categoría" />
        <View className="flex-row flex-wrap gap-2 mb-5">
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = option === category;
            const color      = CATEGORY_COLORS[option];
            return (
              <TouchableOpacity
                key={option}
                onPress={() => setCategory(option)}
                className="px-3 py-2 rounded-lg border"
                style={{ borderColor: isSelected ? color : '#2e2e38', backgroundColor: isSelected ? `${color}18` : '#1a1a1f' }}
              >
                <Text className="text-xs font-medium" style={{ color: isSelected ? color : '#6b6b7e' }}>
                  {CATEGORY_ICONS[option]} {CATEGORY_LABELS[option]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tiempo */}
        <View className="flex-row gap-3 mb-2">
          <View className="flex-1">
            <FieldLabel label="Inicio" />
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              placeholderTextColor="#6b6b7e"
              className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl px-4 py-3 text-[#e8e8f0] text-base font-mono"
            />
          </View>
          <View className="flex-1">
            <FieldLabel label="Minutos" />
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="60"
              placeholderTextColor="#6b6b7e"
              keyboardType="number-pad"
              className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl px-4 py-3 text-[#e8e8f0] text-base font-mono"
            />
          </View>
        </View>

        {/* Duration presets */}
        <View className="flex-row flex-wrap gap-2 mb-5">
          {DURATION_PRESETS.map((minutes) => (
            <TouchableOpacity
              key={minutes}
              onPress={() => setDuration(String(minutes))}
              className={`px-3 py-2 rounded-lg border ${
                duration === String(minutes) ? 'bg-[#7c6aff]/20 border-[#7c6aff]' : 'bg-[#1a1a1f] border-[#2e2e38]'
              }`}
            >
              <Text className={`text-xs font-mono ${duration === String(minutes) ? 'text-[#7c6aff]' : 'text-[#6b6b7e]'}`}>
                {formatDuration(minutes)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recordatorio */}
        <FieldLabel label="Recordatorio previo" />
        <View className="flex-row gap-2 mb-2">
          {NOTIFY_PRESETS.map((mins) => (
            <TouchableOpacity
              key={mins}
              onPress={() => setNotifyBefore(notifyBefore === String(mins) ? '' : String(mins))}
              className={`px-3 py-2 rounded-lg border ${
                notifyBefore === String(mins) ? 'bg-[#fbbf24]/20 border-[#fbbf24]' : 'bg-[#1a1a1f] border-[#2e2e38]'
              }`}
            >
              <Text className={`text-xs font-mono ${notifyBefore === String(mins) ? 'text-[#fbbf24]' : 'text-[#6b6b7e]'}`}>
                🔔 {mins}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={notifyBefore}
          onChangeText={setNotifyBefore}
          placeholder="O escribe los minutos manualmente"
          placeholderTextColor="#6b6b7e"
          keyboardType="number-pad"
          className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl px-4 py-3 text-[#e8e8f0] text-sm mb-5"
        />

        {/* Delete */}
        {isExistingActivity && (
          <TouchableOpacity
            onPress={confirmDelete}
            className="mt-2 border border-[#ff6a8e]/40 rounded-xl px-4 py-3 items-center"
          >
            <Text className="text-[#ff6a8e] text-sm font-medium">Eliminar actividad</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-2">
      {label.toUpperCase()}
    </Text>
  );
}
