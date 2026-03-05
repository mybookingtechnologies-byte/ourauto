import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { getTheme } from '../../src/utils/constants';

export default function TabsLayout() {
  const theme = getTheme(useColorScheme());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedText,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
      }}
    >
      <Tabs.Screen name="marketplace" options={{ title: 'Marketplace', headerShown: false }} />
      <Tabs.Screen name="dealer" options={{ title: 'Dealer', headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
