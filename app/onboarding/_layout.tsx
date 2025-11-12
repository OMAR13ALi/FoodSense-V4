import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="user-info" />
      <Stack.Screen name="dietary-preferences" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="completion" />
    </Stack>
  );
}
