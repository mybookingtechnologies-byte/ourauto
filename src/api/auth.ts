import { apiClient } from './client';
import { AuthUser } from '../store/authStore';

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthApiResponse = {
  token?: string;
  jwt?: string;
  accessToken?: string;
  user?: AuthUser;
};

export type AuthResult = {
  token: string;
  user: AuthUser | null;
};

const extractToken = (payload: AuthApiResponse) => {
  return payload.token ?? payload.jwt ?? payload.accessToken ?? '';
};

export const login = async (payload: LoginPayload): Promise<AuthResult> => {
  const { data } = await apiClient.post<AuthApiResponse>('/login', payload);
  const token = extractToken(data);

  if (!token) {
    throw new Error('Login response did not include a token.');
  }

  return {
    token,
    user: data.user ?? null,
  };
};

export const signup = async (payload: SignupPayload): Promise<AuthResult> => {
  const { data } = await apiClient.post<AuthApiResponse>('/signup', payload);
  const token = extractToken(data);

  if (!token) {
    throw new Error('Signup response did not include a token.');
  }

  return {
    token,
    user: data.user ?? null,
  };
};

export const logout = async () => {
  await apiClient.post('/logout');
};
