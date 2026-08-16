import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from 'constants/api';
import { getOrCreateDeviceId } from 'services/device-identity';

let accessToken: string | null = null;

/**
 * Stores the current Bearer token for subsequent API calls.
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const deviceId = await getOrCreateDeviceId();
  config.headers['x-device-id'] = deviceId;
  config.headers['x-platform'] = Platform.OS;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (__DEV__) {
    const params = config.params ? ` ${JSON.stringify(config.params)}` : '';
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url ?? ''}${params}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      const status = error.response?.status ?? 'network';
      const url = error.config?.url ?? '';
      console.log(`[API] ${status} ${error.config?.method?.toUpperCase() ?? ''} ${url}`);
    }
    return Promise.reject(error);
  },
);
