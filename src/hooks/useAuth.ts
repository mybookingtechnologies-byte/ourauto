import { useMutation } from '@tanstack/react-query';

import { login, logout, LoginPayload, signup, SignupPayload } from '../api/auth';
import { clearAuthSession, setAuthSession, useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const authState = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async ({ token, user }) => {
      await setAuthSession(token, user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) => signup(payload),
    onSuccess: async ({ token, user }) => {
      await setAuthSession(token, user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSettled: async () => {
      await clearAuthSession();
    },
  });

  return {
    ...authState,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    signupError: signupMutation.error,
    logoutError: logoutMutation.error,
  };
};
