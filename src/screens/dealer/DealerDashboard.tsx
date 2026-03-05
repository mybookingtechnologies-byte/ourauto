import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { getTheme } from '../../utils/constants';

export const DealerDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const theme = getTheme(useColorScheme());

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Dealer Dashboard" subtitle="Manage your listings faster" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.greeting, { color: theme.text }]}>Welcome {user?.name || 'Dealer'}</Text>
        <Text style={[styles.description, { color: theme.mutedText }]}>Upload your latest inventory and keep listings fresh.</Text>

        <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => router.push('/(tabs)/dealer/upload')}>
          <Text style={styles.buttonText}>Upload New Listing</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
