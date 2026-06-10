import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Sun, CalendarDays, Flame, TrendingUp, Settings2,
} from 'lucide-react-native';
import { useStore } from '../../src/store/index';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const TABS = [
  { name: 'index',    label: 'HOY',     Icon: Sun },
  { name: 'schedule', label: 'HORARIO', Icon: CalendarDays },
  { name: 'habits',   label: 'HÁBITOS', Icon: Flame },
  { name: 'goals',    label: 'METAS',   Icon: TrendingUp },
  { name: 'settings', label: 'AJUSTES', Icon: Settings2 },
];

// ─── Animated Tab Icon ────────────────────────────────────────────────────────
function TabIcon({
  Icon, focused, badge,
}: {
  Icon: React.ComponentType<any>;
  focused: boolean;
  badge?: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // FIX: llamadas separadas en vez de Animated.parallel con drivers distintos
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.05 : 1,
      useNativeDriver: true,   // solo transform → native driver OK
      tension: 150,
      friction: 10,
    }).start();

    Animated.timing(bgAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,  // backgroundColor → JS driver OK
    }).start();
  }, [focused]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(124,106,255,0)', 'rgba(124,106,255,0.15)'],
  });

  return (
    // FIX: dos Animated.View anidados — cada uno con un solo driver
    // Exterior: backgroundColor con JS driver
    <Animated.View style={[s.iconWrap, { backgroundColor: bgColor }]}>
      {/* Interior: transform con native driver */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
        <Icon
          size={22}
          strokeWidth={focused ? 2.2 : 1.8}
          color={focused ? '#7c6aff' : '#55556a'}
        />
        {badge && badge > 0 ? (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

// ─── Tab Label ────────────────────────────────────────────────────────────────
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[s.label, focused && s.labelActive]}>
      {label}
    </Text>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { tasks, habits, habitLogs } = useStore();

  const today        = new Date().toISOString().slice(0, 10);
  const pendingTasks  = tasks.filter((t) => !t.done).length;
  const pendingHabits = habits.filter(
    (h) => !habitLogs.find((l) => l.habitId === h.id && l.date === today)?.done,
  ).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {TABS.map(({ name, label, Icon }) => {
        const badge = name === 'index'  ? pendingTasks
                    : name === 'habits' ? pendingHabits
                    : undefined;
        return (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              tabBarIcon: ({ focused }) => (
                <View style={s.tabItem}>
                  <TabIcon Icon={Icon} focused={focused} badge={badge} />
                  <TabLabel label={label} focused={focused} />
                  {focused && <View style={s.activeDot} />}
                </View>
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  tabBar: {
    backgroundColor: '#141418',
    borderTopColor: '#26262f',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingHorizontal: 4,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  iconWrap: {
    width: 46,
    height: 32,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontFamily: MONO,
    fontSize: 9,
    color: '#55556a',
    letterSpacing: 0.04,
  },
  labelActive: {
    color: '#7c6aff',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: '#f87171',
    borderWidth: 2,
    borderColor: '#141418',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontFamily: MONO,
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 18,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#7c6aff',
    opacity: 0.7,
  },
});
