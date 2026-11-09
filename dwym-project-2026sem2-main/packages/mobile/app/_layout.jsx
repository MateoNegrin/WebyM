import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { SessionProvider } from '@batalla/hooks';
import { apiConfig } from '../lib/config.js';
import { sessionPersistence } from '../lib/storage.js';
import { colors, fontAssets } from '../components/theme.js';

SplashScreen.preventAutoHideAsync();

// En móvil, "foco" = app en primer plano: react-query pausa el polling en segundo plano.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => sub.remove();
  });
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SessionProvider config={apiConfig} storage={sessionPersistence}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
