import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@store/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@constants/index';
import { Activity } from '@types/index';

export default function ScheduleScreen() {
  const { templates, getTodayTemplate } = useStore();
  const router = useRouter();
  const todayTemplate = getTodayTemplate();

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b border-[#2e2e38] flex-row items-center justify-between">
        <Text className="text-[#e8e8f0] text-xl font-semibold">Horario</Text>
        <TouchableOpacity
          className="bg-[#7c6aff] px-4 py-2 rounded-lg"
          onPress={() => router.push('/template/new')}
        >
          <Text className="text-white text-sm font-medium">+ Nueva plantilla</Text>
        </TouchableOpacity>
      </View>

      {/* Template tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        className="border-b border-[#2e2e38]"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {templates.map((t) => (
          <TouchableOpacity
            key={t.id}
            className={`px-4 py-2 rounded-full border ${
              todayTemplate?.id === t.id
                ? 'bg-[#7c6aff]/20 border-[#7c6aff]'
                : 'border-[#2e2e38] bg-[#1a1a1f]'
            }`}
          >
            <Text className={`text-sm font-medium ${
              todayTemplate?.id === t.id ? 'text-[#7c6aff]' : 'text-[#6b6b7e]'
            }`}>
              {t.name}
              <Text className="text-[10px]"> · {t.days.join('/')}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timeline */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {(todayTemplate ?? templates[0])?.activities.map((a, i, arr) => (
          <ActivityRow key={a.id} activity={a} isLast={i === arr.length - 1} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityRow({ activity: a, isLast }: { activity: Activity; isLast: boolean }) {
  const color = a.color ?? CATEGORY_COLORS[a.category];
  const icon  = CATEGORY_ICONS[a.category];
  const hrs   = Math.floor(a.duration / 60);
  const mins  = a.duration % 60;
  const dur   = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;

  return (
    <View className="flex-row gap-3 mb-0">
      {/* Time + line */}
      <View className="items-center w-12">
        <Text className="text-[#6b6b7e] text-xs font-mono">{a.startTime}</Text>
        {!isLast && (
          <View className="flex-1 w-px bg-[#2e2e38] mt-1" />
        )}
      </View>

      {/* Card */}
      <View
        className="flex-1 rounded-xl p-3 mb-3"
        style={{ backgroundColor: color + '14', borderWidth: 1, borderColor: color + '33' }}
      >
        <View className="flex-row items-center gap-2 mb-1">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <Text className="text-[#e8e8f0] text-sm font-medium flex-1">{icon} {a.name}</Text>
          <Text className="text-xs font-mono" style={{ color }}>{dur}</Text>
        </View>
        {a.description && (
          <Text className="text-[#6b6b7e] text-xs leading-relaxed">{a.description}</Text>
        )}
      </View>
    </View>
  );
}
