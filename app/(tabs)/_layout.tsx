import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'android' ? 30 : 20,
          left: 16,
          right: 16,
          height: Platform.OS === 'android' ? 75 : 70,
          borderRadius: 16,
          paddingBottom: Platform.OS === 'android' ? 16 : 12,
          paddingTop: 12,
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          shadowColor: '#000',
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Track',
          tabBarIcon: ({ color }) => <IconSymbol size={32} name="pencil.and.list.clipboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={32} name="chart.pie.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol size={32} name="calendar" color={color} />,
        }}
      />
    </Tabs>
  );
}
