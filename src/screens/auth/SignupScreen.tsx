import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';

import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { getTheme } from '../../utils/constants';

export const SignupScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, isSignupLoading } = useAuth();
  const theme = getTheme(useColorScheme());
  const router = useRouter();

  const onSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing details', 'Please complete all fields.');
      return;
    }

    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      router.replace('/(tabs)/profile');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed.';
      Alert.alert('Signup failed', message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Sign Up" subtitle="Create your OurAuto account" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.text }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Your full name"
          placeholderTextColor={theme.mutedText}
        />

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
          placeholder="Create a password"
          placeholderTextColor={theme.mutedText}
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary, opacity: isSignupLoading ? 0.6 : 1 }]}
          onPress={onSignup}
          disabled={isSignupLoading}
        >
          <Text style={styles.buttonText}>{isSignupLoading ? 'Creating account...' : 'Sign Up'}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/auth/login')}>
          <Text style={[styles.link, { color: theme.primary }]}>Already have an account? Login</Text>
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
