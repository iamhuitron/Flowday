import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Sun, CalendarDays, Flame, TrendingUp, Settings2,
} from 'lucide-react-native';
import { useStore } from '../../src/store/index';
import { useTheme } from '../../src/hooks/useTheme';

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
  Icon, focused, badge, accent,
}: {
  Icon: React.ComponentType<any>;
  focused: boolean;
  badge?: number;
  accent: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // FIX: separate animations — no Animated.parallel con drivers distintos
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.05 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 10,
    }).start();
    Animated.timing(bgAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(0,0,0,0)', accent + '26'],  // 15% opacidad del accent
  });

  return (
    // Exterior: backgroundColor con JS driver
    <Animated.View style={[s.iconWrap, { backgroundColor: bgColor }]}>
      {/* Interior: transform con native driver */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
        <Icon
          size={22}
          strokeWidth={focused ? 2.2 : 1.8}
          color={focused ? accent : '#55556a'}
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
function TabLabel({ label, focused, accent }: { label: string; focused: boolean; accent: string }) {
  return (
    <Text style={[s.label, focused && { color: accent }]}>
      {label}
    </Text>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { tasks, habits, habitLogs } = useStore();
  const { accent }                   = useTheme();

  const today        = new Date().toISOString().slice(0, 10);
  const pendingTasks  = tasks.filter((t) => !t.done).length;
  const pendingHabits = habits.filter(
    (h) => !habitLogs.find((l) => l.habitId === h.id && l.date === today)?.done,
  ).length;

  return (
    <Tabs
      screenOptions={{
        headerShown:   false,
        tabBarStyle:   s.tabBar,
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
                  <TabIcon Icon={Icon} focused={focused} badge={badge} accent={accent} />
                  <TabLabel label={label} focused={focused} accent={accent} />
                  {focused && (
                    <View style={[s.activeDot, { backgroundColor: accent }]} />
                  )}
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
    borderTopColor:  '#26262f',
    borderTopWidth:  1,
    height:          Platform.OS === 'ios' ? 88 : 68,
    paddingTop:      8,
    paddingBottom:   Platform.OS === 'ios' ? 28 : 10,
    paddingHorizontal: 4,
    elevation:       0,
  },
  tabItem: {
    alignItems: 'center',
    gap:        3,
    paddingTop: 2,
  },
  iconWrap: {
    width:          46,
    height:         32,
    borderRadius:   99,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  label: {
    fontFamily: MONO,
    fontSize:   9,
    color:      '#55556a',
    letterSpacing: 0.04,
  },
  badge: {
    position:        'absolute',
    top:             -2,
    right:           2,
    minWidth:        16,
    height:          16,
    borderRadius:    99,
    backgroundColor: '#f87171',
    borderWidth:     2,
    borderColor:     '#141418',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontFamily: MONO,
    fontSize:   8,
    color:      '#fff',
    fontWeight: '700',
  },
  activeDot: {
    position:     'absolute',
    bottom:       -6,
    width:        18,
    height:       3,
    borderRadius: 99,
    opacity:      0.7,
  },
});
