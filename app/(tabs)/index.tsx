import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '@store/index';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@constants/index';

export default function TodayScreen() {
  const {
    getTodayTemplate,
    habits,
    habitLogs,
    toggleHabitLog,
    streak,
    getGlobalProgress,
  } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const template = getTodayTemplate();
  const todayLogs = habitLogs.filter((l) => l.date === today);
  const habitsDone = todayLogs.filter((l) => l.done).length;
  const globalPct = getGlobalProgress();

  // Current activity
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const currentActivity = template?.activities.find((a) => {
    const [h, m] = a.startTime.split(':').map(Number);
    const start = h * 60 + m;
    return nowMins >= start && nowMins < start + a.duration;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-[#6b6b7e] text-xs font-mono mb-1">
            {format(now, "EEEE d 'de' MMMM", { locale: es }).toUpperCase()}
          </Text>
          <Text className="text-[#e8e8f0] text-2xl font-semibold">
            Buen día, Miguel 👋
          </Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-6">
          <StatCard label="Racha" value={`${streak}d`} sub="🔥" color="#fbbf24" />
          <StatCard label="Hábitos" value={`${habitsDone}/${habits.length}`} sub="hoy" color="#4ade80" />
          <StatCard label="Ruta" value={`${globalPct}%`} sub="global" color="#7c6aff" />
        </View>

        {/* Current activity */}
        {currentActivity && (
          <View className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-4 mb-6">
            <Text className="text-[#6b6b7e] text-xs font-mono mb-1">AHORA</Text>
            <View className="flex-row items-center gap-3">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[currentActivity.category] }}
              />
              <View className="flex-1">
                <Text className="text-[#e8e8f0] text-base font-medium">
                  {CATEGORY_ICONS[currentActivity.category]} {currentActivity.name}
                </Text>
                {currentActivity.description && (
                  <Text className="text-[#6b6b7e] text-xs mt-1">
                    {currentActivity.description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Habits */}
        <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-3">
          HÁBITOS DE HOY
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {habits.map((h) => {
            const done = todayLogs.find((l) => l.habitId === h.id)?.done ?? false;
            return (
              <TouchableOpacity
                key={h.id}
                onPress={() => toggleHabitLog(h.id, today)}
                className={`px-4 py-3 rounded-xl border ${
                  done
                    ? 'border-[#4ade80] bg-[#4ade80]/10'
                    : 'border-[#2e2e38] bg-[#1a1a1f]'
                }`}
              >
                <Text className={`text-sm font-medium ${done ? 'text-[#4ade80]' : 'text-[#e8e8f0]'}`}>
                  {h.icon} {h.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Today's schedule preview */}
        {template && (
          <>
            <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-3">
              PLANTILLA HOY — {template.name}
            </Text>
            {template.activities.slice(0, 6).map((a) => (
              <View
                key={a.id}
                className="flex-row items-center gap-3 py-3 border-b border-[#2e2e38]"
              >
                <Text className="text-[#6b6b7e] text-xs font-mono w-12">
                  {a.startTime}
                </Text>
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[a.category] }}
                />
                <Text className="text-[#e8e8f0] text-sm flex-1">{a.name}</Text>
                <Text className="text-[#6b6b7e] text-xs">{a.duration}min</Text>
              </View>
            ))}
            {template.activities.length > 6 && (
              <Text className="text-[#6b6b7e] text-xs text-center mt-3">
                +{template.activities.length - 6} más · ve Horario completo
              </Text>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label, value, sub, color,
}: { label: string; value: string; sub: string; color: string }) {
  return (
    <View className="flex-1 bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-3">
      <Text className="text-[#6b6b7e] text-[10px] font-mono mb-1">{label.toUpperCase()}</Text>
      <Text className="text-[#e8e8f0] text-xl font-semibold font-mono" style={{ color }}>
        {value}
      </Text>
      <Text className="text-[#6b6b7e] text-[10px] mt-1">{sub}</Text>
    </View>
  );
}
