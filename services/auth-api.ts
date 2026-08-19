import axios from 'axios';
import { Session } from 'types/storageTypes';
import { apiClient } from 'services/api-client';
import { ApiMeResponse, LoginResponse } from 'types/auth-api.types';
import { mapApiUserToSessionUser } from 'utils/map-api-user';

type LoginWithPasswordInput = {
  readonly email: string;
  readonly password: string;
};

/**
 * Logs in against Sunnected and loads the current user profile.
 */
export async function loginWithPassword(
  input: LoginWithPasswordInput,
): Promise<Session> {
  const loginResponse = await apiClient.post<LoginResponse>('/auth/login', {
    email: input.email.trim(),
    password: input.password,
  });
  const token = loginResponse.data.access_token;
  const meResponse = await apiClient.get<ApiMeResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    token,
    user: mapApiUserToSessionUser(meResponse.data),
  };
}

/**
 * Confirms the stored access token is still valid.
 */
export async function fetchCurrentUser(): Promise<ApiMeResponse> {
  const meResponse = await apiClient.get<ApiMeResponse>('/auth/me');
  return meResponse.data;
}

/**
 * Returns true when the API rejected credentials or a stale token.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/**
 * Asks the API to email a web reset link. Reset still happens on the Sunnected site.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
}
