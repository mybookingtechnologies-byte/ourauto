import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import { STORAGE_KEYS } from '../utils/constants';

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
};

const listeners = new Set<() => void>();

let state: AuthState = {
  token: null,
  user: null,
  hydrated: false,
};

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setState = (next: Partial<AuthState>) => {
  state = { ...state, ...next };
  emit();
};

export const getAuthState = () => state;

export const subscribeAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useAuthStore = () => {
  return useSyncExternalStore(subscribeAuth, getAuthState);
};

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const hydrateAuthStore = async () => {
  const [token, userRaw] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.authToken),
    SecureStore.getItemAsync(STORAGE_KEYS.authUser),
  ]);

  setState({
    token: token ?? null,
    user: safeParse<AuthUser>(userRaw),
    hydrated: true,
  });
};

export const setAuthSession = async (token: string, user: AuthUser | null) => {
  await SecureStore.setItemAsync(STORAGE_KEYS.authToken, token);

  if (user) {
    await SecureStore.setItemAsync(STORAGE_KEYS.authUser, JSON.stringify(user));
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.authUser);
  }

  setState({ token, user });
};

export const clearAuthSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.authToken),
    SecureStore.deleteItemAsync(STORAGE_KEYS.authUser),
  ]);

  setState({ token: null, user: null });
};
