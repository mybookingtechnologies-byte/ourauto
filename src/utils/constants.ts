import { ColorSchemeName } from 'react-native';

export const API_BASE_URL = 'https://www.ourauto.in/api';
export const API_TIMEOUT_MS = 15000;

export const STORAGE_KEYS = {
  authToken: 'ourauto.auth.token',
  authUser: 'ourauto.auth.user',
} as const;

export const palette = {
  light: {
    background: '#F4F6FA',
    surface: '#FFFFFF',
    text: '#0F172A',
    mutedText: '#64748B',
    border: '#E2E8F0',
    primary: '#0A6CFF',
    error: '#E11D48',
    cardShadow: '#000000',
  },
  dark: {
    background: '#0B1220',
    surface: '#121A2B',
    text: '#E2E8F0',
    mutedText: '#94A3B8',
    border: '#25304A',
    primary: '#5EA2FF',
    error: '#FB7185',
    cardShadow: '#000000',
  },
};

export const getTheme = (scheme: ColorSchemeName) => {
  return scheme === 'dark' ? palette.dark : palette.light;
};
