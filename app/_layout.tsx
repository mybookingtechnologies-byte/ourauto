import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { hydrateAuthStore } from '../src/store/authStore';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Preventing splash can throw if called more than once in dev.
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      await hydrateAuthStore();
      setReady(true);
      await SplashScreen.hideAsync();
    };

    bootstrap().catch(() => {
      setReady(true);
      SplashScreen.hideAsync().catch(() => undefined);
    });
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="listing/[id]/index" options={{ title: 'Listing Details' }} />
            <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
            <Stack.Screen name="auth/signup" options={{ title: 'Sign Up' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
