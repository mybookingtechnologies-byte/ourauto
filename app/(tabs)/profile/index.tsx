import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Header } from '../../../src/components/Header';
import { useAuth } from '../../../src/hooks/useAuth';
import { getTheme } from '../../../src/utils/constants';

export default function ProfileRoute() {
  const { user, token, logout, isLogoutLoading } = useAuth();
  const theme = getTheme(useColorScheme());
  const router = useRouter();

  const onLogout = async () => {
    try {
      await logout();
      Alert.alert('Logged out', 'Your session has been closed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed.';
      Alert.alert('Logout failed', message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Profile" subtitle={token ? 'Signed in' : 'Guest session'} />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.mutedText }]}>Name</Text>
        <Text style={[styles.value, { color: theme.text }]}>{user?.name || '-'}</Text>

        <Text style={[styles.label, { color: theme.mutedText }]}>Email</Text>
        <Text style={[styles.value, { color: theme.text }]}>{user?.email || '-'}</Text>

        {token ? (
          <Pressable
            style={[styles.button, { backgroundColor: theme.error, opacity: isLogoutLoading ? 0.6 : 1 }]}
            onPress={onLogout}
            disabled={isLogoutLoading}
          >
            <Text style={styles.buttonText}>{isLogoutLoading ? 'Signing out...' : 'Logout'}</Text>
          </Pressable>
        ) : (
          <View style={styles.authActions}>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => router.push('/auth/login')}>
              <Text style={styles.buttonText}>Login</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/auth/signup')}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    marginBottom: 6,
  },
  authActions: {
    marginTop: 8,
    gap: 10,
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
