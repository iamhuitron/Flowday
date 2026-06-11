import '../global.css';
import { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  DMSans_300Light, DMSans_400Regular,
  DMSans_500Medium, DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../src/store/index';
import {
  setupNotificationHandler,
  createAndroidChannel,
  rescheduleAll,
} from '../src/utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_300Light, DMSans_400Regular,
    DMSans_500Medium, DMSans_600SemiBold,
    DMSerifDisplay_400Regular,
  });

  const { templates, settings } = useStore();
  const appState = useRef(AppState.currentState);

  // ── Inicializar notificaciones al arrancar ─────────────────────────────────
  useEffect(() => {
    setupNotificationHandler();
    createAndroidChannel();
    rescheduleAll(templates, settings);
  }, []);

  // ── Reagendar cuando templates o settings cambian ─────────────────────────
  useEffect(() => {
    rescheduleAll(templates, settings);
  }, [
    templates,
    settings.notificationsEnabled,
    settings.notifyActivities,
    settings.notifySummary,
  ]);

  // ── Reagendar al volver a primer plano ────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        rescheduleAll(templates, settings);
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [templates, settings]);

  // ── Splash ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={s.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0c0c0f" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0c0c0f' },
            animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="template/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="activity/[id]"  options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="habit/[id]"     options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c0c0f' },
});
