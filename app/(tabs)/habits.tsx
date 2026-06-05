import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '@store/index';

export default function HabitsScreen() {
  const { habits, habitLogs, toggleHabitLog, getStreakForHabit, streak } = useStore();

  const today = new Date().toISOString().slice(0, 10);

  // Last 7 days for mini-calendar
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      <View className="px-5 pt-4 pb-3 border-b border-[#2e2e38] flex-row items-center justify-between">
        <Text className="text-[#e8e8f0] text-xl font-semibold">Hábitos</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">🔥</Text>
          <Text className="text-[#fbbf24] text-xl font-semibold font-mono">{streak}</Text>
          <Text className="text-[#6b6b7e] text-sm">días</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>

        {/* 7-day mini calendar header */}
        <View className="flex-row justify-between mb-6">
          {last7.map((date) => {
            const d = new Date(date + 'T12:00:00');
            const isToday = date === today;
            const anyDone = habits.some(
              (h) => habitLogs.find((l) => l.habitId === h.id && l.date === date)?.done,
            );
            return (
              <View key={date} className="items-center gap-1">
                <Text className="text-[#6b6b7e] text-[10px] font-mono">
                  {format(d, 'EEE', { locale: es }).toUpperCase().slice(0, 2)}
                </Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center border ${
                  isToday ? 'border-[#7c6aff] bg-[#7c6aff]/20' :
                  anyDone ? 'border-[#4ade80] bg-[#4ade80]/10' :
                  'border-[#2e2e38] bg-[#1a1a1f]'
                }`}>
                  <Text className={`text-xs font-mono ${
                    isToday ? 'text-[#7c6aff]' :
                    anyDone ? 'text-[#4ade80]' :
                    'text-[#6b6b7e]'
                  }`}>
                    {format(d, 'd')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Habit list */}
        <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-3">HOY</Text>
        {habits.map((h) => {
          const done = habitLogs.find((l) => l.habitId === h.id && l.date === today)?.done ?? false;
          const habitStreak = getStreakForHabit(h.id);
          return (
            <TouchableOpacity
              key={h.id}
              onPress={() => toggleHabitLog(h.id, today)}
              className={`flex-row items-center gap-4 p-4 rounded-xl border mb-3 ${
                done ? 'border-[#4ade80] bg-[#4ade80]/06' : 'border-[#2e2e38] bg-[#1a1a1f]'
              }`}
            >
              <Text className="text-2xl">{h.icon}</Text>
              <View className="flex-1">
                <Text className={`text-sm font-medium ${done ? 'text-[#4ade80]' : 'text-[#e8e8f0]'}`}>
                  {h.name}
                </Text>
                {habitStreak > 0 && (
                  <Text className="text-[#6b6b7e] text-xs mt-0.5">
                    🔥 {habitStreak} días seguidos
                  </Text>
                )}
              </View>
              {/* Checkbox */}
              <View className={`w-6 h-6 rounded-md border-[1.5px] items-center justify-center ${
                done ? 'border-[#4ade80] bg-[#4ade80]/20' : 'border-[#2e2e38]'
              }`}>
                {done && <Text className="text-[#4ade80] text-xs font-bold">✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}
