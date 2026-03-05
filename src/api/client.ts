import axios, { AxiosError } from 'axios';

import { getAuthState } from '../store/authStore';
import { API_BASE_URL, API_TIMEOUT_MS } from '../utils/constants';

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ErrorPayload = {
  message?: string;
  error?: string;
};

const getErrorMessage = (payload: ErrorPayload | undefined, fallback: string) => {
  return payload?.message ?? payload?.error ?? fallback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorPayload>) => {
    if (!error.response) {
      return Promise.reject(new ApiError('Network error. Please check your connection.'));
    }

    const message = getErrorMessage(error.response.data, 'Something went wrong.');
    return Promise.reject(new ApiError(message, error.response.status, error.response.data));
  }
);
