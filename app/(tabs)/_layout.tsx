import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

// Simple icon component placeholder — replace with lucide-react-native
function TabIcon({ label }: { label: string }) {
  const icons: Record<string, string> = {
    Hoy: '◈', Horario: '◎', Hábitos: '◇', Metas: '◆', Ajustes: '⚙',
  };
  return null; // icons rendered via tabBarLabel
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1f',
          borderTopColor: '#2e2e38',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarActiveTintColor: '#7c6aff',
        tabBarInactiveTintColor: '#6b6b7e',
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Hoy',     tabBarLabel: 'Hoy' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Horario', tabBarLabel: 'Horario' }} />
      <Tabs.Screen name="habits"   options={{ title: 'Hábitos', tabBarLabel: 'Hábitos' }} />
      <Tabs.Screen name="goals"    options={{ title: 'Metas',   tabBarLabel: 'Metas' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarLabel: 'Ajustes' }} />
    </Tabs>
  );
}
