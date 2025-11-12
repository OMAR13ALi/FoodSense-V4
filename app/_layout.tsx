import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout mechanism - if loading takes too long, show error
  useEffect(() => {
    if (!loading) {
      setLoadingTimeout(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization taking longer than expected...');
        setLoadingTimeout(true);
      }
    }, 30000); // 30 second timeout (increased for slow networks)

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup && !inOnboarding) {
      // Redirect to onboarding if not authenticated
      router.replace('/onboarding/welcome');
    } else if (user && (inAuthGroup || inOnboarding)) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [user, segments, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <ActivityIndicator size="large" />
        {loadingTimeout && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: 10 }}>
              Loading is taking longer than expected...
            </Text>
            <Text
              style={{ color: '#4a9eff', textDecorationLine: 'underline' }}
              onPress={() => router.replace('/onboarding/welcome')}
            >
              Return to Welcome Screen
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootLayoutNav />
            <StatusBar style="auto" />
            <Toast />
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
