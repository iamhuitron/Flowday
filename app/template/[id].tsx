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
import { useStore } from '@store/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@constants/index';
import { Activity, DayOfWeek } from '@types/index';
import { formatDuration, timeToMinutes, uid } from '@utils/index';

const DAY_OPTIONS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'mon', label: 'Lunes', short: 'L' },
  { key: 'tue', label: 'Martes', short: 'M' },
  { key: 'wed', label: 'Miércoles', short: 'X' },
  { key: 'thu', label: 'Jueves', short: 'J' },
  { key: 'fri', label: 'Viernes', short: 'V' },
  { key: 'sat', label: 'Sábado', short: 'S' },
  { key: 'sun', label: 'Domingo', short: 'D' },
];

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function sortActivities(activities: Activity[]) {
  return [...activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export default function TemplateEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const routeId = readParam(params.id);
  const {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useStore();

  const existingTemplate = templates.find((template) => template.id === routeId);
  const [templateId] = useState(() => existingTemplate?.id ?? `template-${uid()}`);
  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [days, setDays] = useState<DayOfWeek[]>(existingTemplate?.days ?? ['mon', 'wed', 'fri']);

  const activities = sortActivities(existingTemplate?.activities ?? []);
  const isSavedTemplate = Boolean(existingTemplate);
  const totalMinutes = activities.reduce((sum, activity) => sum + activity.duration, 0);

  const toggleDay = (day: DayOfWeek) => {
    setDays((current) => (
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    ));
  };

  const saveTemplate = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Nombre requerido', 'Dale un nombre a la plantilla para guardarla.');
      return;
    }

    if (days.length === 0) {
      Alert.alert('Selecciona días', 'Elige al menos un día para usar esta plantilla.');
      return;
    }

    const now = new Date().toISOString();
    const nextTemplate = {
      id: templateId,
      name: cleanName,
      days,
      activities: existingTemplate?.activities ?? [],
      createdAt: existingTemplate?.createdAt ?? now,
      updatedAt: now,
    };

    if (existingTemplate) updateTemplate(nextTemplate);
    else addTemplate(nextTemplate);

    router.replace(`/template/${templateId}`);
  };

  const confirmDeleteTemplate = () => {
    if (!existingTemplate) return;

    Alert.alert(
      'Eliminar plantilla',
      `Se eliminará "${existingTemplate.name}" con todas sus actividades.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteTemplate(existingTemplate.id);
            router.replace('/schedule');
          },
        },
      ],
    );
  };

  const confirmDeleteActivity = (activity: Activity) => {
    if (!existingTemplate) return;

    Alert.alert(
      'Eliminar actividad',
      `Se eliminará "${activity.name}" de esta plantilla.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            updateTemplate({
              ...existingTemplate,
              activities: existingTemplate.activities.filter((item) => item.id !== activity.id),
              updatedAt: new Date().toISOString(),
            });
          },
        },
      ],
    );
  };

  const openActivityEditor = (activityId = 'new') => {
    if (!existingTemplate) {
      Alert.alert('Guarda primero', 'Guarda la plantilla antes de agregar actividades.');
      return;
    }

    router.push({
      pathname: '/activity/[id]',
      params: { id: activityId, templateId: existingTemplate.id },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      <View className="px-5 pt-3 pb-3 border-b border-[#2e2e38] flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-lg bg-[#1a1a1f] border border-[#2e2e38] items-center justify-center"
        >
          <Text className="text-[#e8e8f0] text-xl">‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[#6b6b7e] text-[10px] font-mono tracking-widest">
            PLANTILLA
          </Text>
          <Text className="text-[#e8e8f0] text-lg font-semibold">
            {existingTemplate?.name ?? 'Nueva plantilla'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={saveTemplate}
          className="bg-[#7c6aff] px-4 py-2.5 rounded-lg"
        >
          <Text className="text-white text-sm font-medium">Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-2">
          NOMBRE
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej. Fin de semana"
          placeholderTextColor="#6b6b7e"
          className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl px-4 py-3 text-[#e8e8f0] text-base mb-5"
        />

        <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-2">
          DÍAS
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {DAY_OPTIONS.map((day) => {
            const selected = days.includes(day.key);
            return (
              <TouchableOpacity
                key={day.key}
                onPress={() => toggleDay(day.key)}
                className={`px-3 py-2 rounded-lg border ${
                  selected
                    ? 'bg-[#7c6aff]/20 border-[#7c6aff]'
                    : 'bg-[#1a1a1f] border-[#2e2e38]'
                }`}
              >
                <Text className={`text-xs font-mono ${
                  selected ? 'text-[#7c6aff]' : 'text-[#6b6b7e]'
                }`}>
                  {day.short} · {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-row gap-3 mb-6">
          <TemplateStat label="Actividades" value={String(activities.length)} />
          <TemplateStat label="Tiempo" value={formatDuration(totalMinutes)} />
          <TemplateStat label="Días" value={String(days.length)} />
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest">
            ACTIVIDADES
          </Text>
          <TouchableOpacity
            onPress={() => openActivityEditor()}
            className="bg-[#222228] px-3 py-2 rounded-lg border border-[#2e2e38]"
          >
            <Text className="text-[#e8e8f0] text-xs font-medium">+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {!isSavedTemplate && (
          <View className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-4 mb-4">
            <Text className="text-[#6b6b7e] text-sm leading-relaxed">
              Guarda la plantilla para empezar a crear actividades dentro de ella.
            </Text>
          </View>
        )}

        {isSavedTemplate && activities.length === 0 && (
          <View className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-4">
            <Text className="text-[#e8e8f0] text-sm font-medium mb-1">
              Esta plantilla todavía está vacía
            </Text>
            <Text className="text-[#6b6b7e] text-xs leading-relaxed">
              Agrega bloques como dormir, universidad, ejercicio o estudio para armar el día.
            </Text>
          </View>
        )}

        {activities.map((activity) => (
          <ActivityEditorRow
            key={activity.id}
            activity={activity}
            onEdit={() => openActivityEditor(activity.id)}
            onDelete={() => confirmDeleteActivity(activity)}
          />
        ))}

        {isSavedTemplate && (
          <TouchableOpacity
            onPress={confirmDeleteTemplate}
            className="mt-6 border border-[#ff6a8e]/40 rounded-xl px-4 py-3 items-center"
          >
            <Text className="text-[#ff6a8e] text-sm font-medium">Eliminar plantilla</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TemplateStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-3">
      <Text className="text-[#6b6b7e] text-[10px] font-mono mb-1">
        {label.toUpperCase()}
      </Text>
      <Text className="text-[#e8e8f0] text-lg font-semibold font-mono">{value}</Text>
    </View>
  );
}

function ActivityEditorRow({
  activity,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = activity.color ?? CATEGORY_COLORS[activity.category];
  const icon = CATEGORY_ICONS[activity.category];

  return (
    <View
      className="rounded-xl p-3 mb-3 border"
      style={{ backgroundColor: `${color}12`, borderColor: `${color}33` }}
    >
      <View className="flex-row items-start gap-3">
        <Text className="text-[#6b6b7e] text-xs font-mono w-12 mt-0.5">
          {activity.startTime}
        </Text>
        <View className="flex-1">
          <Text className="text-[#e8e8f0] text-sm font-semibold">
            {icon} {activity.name}
          </Text>
          <Text className="text-[#6b6b7e] text-xs mt-1">
            {formatDuration(activity.duration)}
            {activity.description ? ` · ${activity.description}` : ''}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-end gap-2 mt-3">
        <TouchableOpacity
          onPress={onEdit}
          className="px-3 py-2 rounded-lg bg-[#222228] border border-[#2e2e38]"
        >
          <Text className="text-[#e8e8f0] text-xs font-medium">Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="px-3 py-2 rounded-lg border border-[#ff6a8e]/40"
        >
          <Text className="text-[#ff6a8e] text-xs font-medium">Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
