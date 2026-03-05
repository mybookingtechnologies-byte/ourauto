import axios, { AxiosError } from 'axios';

import { clearAuthSession, getAuthState } from '../store/authStore';
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

const CSRF_COOKIE_NAME = 'ourauto_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const APP_ORIGIN = 'https://www.ourauto.in';

let csrfToken: string | null = null;
let csrfFetchInFlight: Promise<void> | null = null;

const parseCsrfFromSetCookie = (setCookieHeader: string | string[] | undefined) => {
  if (!setCookieHeader) {
    return null;
  }

  const cookieHeader = Array.isArray(setCookieHeader) ? setCookieHeader.join(';') : setCookieHeader;
  const match = cookieHeader.match(/ourauto_csrf=([^;]+)/);
  return match?.[1] ?? null;
};

const attachCsrfFromResponse = (headers: Record<string, unknown>) => {
  const setCookie = headers['set-cookie'] as string | string[] | undefined;
  const tokenFromCookie = parseCsrfFromSetCookie(setCookie);

  if (tokenFromCookie) {
    csrfToken = tokenFromCookie;
  }
};

const ensureCsrfToken = async () => {
  if (csrfToken) {
    return;
  }

  if (csrfFetchInFlight) {
    await csrfFetchInFlight;
    return;
  }

  // A safe GET initializes the backend CSRF cookie.
  csrfFetchInFlight = axios
    .get(`${API_BASE_URL}/listings`, {
      timeout: API_TIMEOUT_MS,
      headers: {
        Origin: APP_ORIGIN,
      },
    })
    .then((response) => {
      attachCsrfFromResponse(response.headers as Record<string, unknown>);
    })
    .finally(() => {
      csrfFetchInFlight = null;
    });

  await csrfFetchInFlight;
};

const getErrorMessage = (payload: ErrorPayload | undefined, fallback: string) => {
  return payload?.message ?? payload?.error ?? fallback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  config.headers.Origin = APP_ORIGIN;

  const token = getAuthState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method ?? 'get').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutating) {
    await ensureCsrfToken();

    if (csrfToken) {
      config.headers[CSRF_HEADER_NAME] = csrfToken;
      config.headers.Cookie = `${CSRF_COOKIE_NAME}=${csrfToken}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    attachCsrfFromResponse(response.headers as Record<string, unknown>);
    return response;
  },
  (error: AxiosError<ErrorPayload>) => {
    if (!error.response) {
      return Promise.reject(new ApiError('Network error. Please check your connection.'));
    }

    if (error.response.status === 401) {
      clearAuthSession().catch(() => undefined);
    }

    const message = getErrorMessage(error.response.data, 'Something went wrong.');
    return Promise.reject(new ApiError(message, error.response.status, error.response.data));
  }
);
