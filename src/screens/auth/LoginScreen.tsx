import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';

import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { getTheme } from '../../utils/constants';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoginLoading } = useAuth();
  const theme = getTheme(useColorScheme());
  const router = useRouter();

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)/profile');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      Alert.alert('Login failed', message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Login" subtitle="Access your dealer account" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="you@example.com"
          placeholderTextColor={theme.mutedText}
        />

        <Text style={[styles.label, { color: theme.text }]}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Your password"
          placeholderTextColor={theme.mutedText}
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary, opacity: isLoginLoading ? 0.6 : 1 }]}
          onPress={onLogin}
          disabled={isLoginLoading}
        >
          <Text style={styles.buttonText}>{isLoginLoading ? 'Signing in...' : 'Login'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/auth/signup')}>
          <Text style={[styles.link, { color: theme.primary }]}>No account? Sign up</Text>
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: {
    marginTop: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 6,
  },
});
