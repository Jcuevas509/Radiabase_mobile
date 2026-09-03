import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from 'constants/api';

const STORAGE_KEY = 'radiabase.apiBaseUrl';

let overrideUrl: string | null = null;

/**
 * Returns the API URL the phone should call (override, then baked env).
 */
export function getApiBaseUrl(): string {
  return overrideUrl ?? API_BASE_URL;
}

/**
 * Loads a stored override from the last login on this install.
 */
export async function loadApiBaseUrlOverride(): Promise<string> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const trimmed = stored?.trim().replace(/\/$/, '') ?? '';
  overrideUrl = trimmed.length > 0 ? trimmed : null;
  return getApiBaseUrl();
}

/**
 * Persists a server URL so this personal install can point at local Nest.
 */
export async function saveApiBaseUrlOverride(url: string): Promise<void> {
  const next = url.trim().replace(/\/$/, '');
  overrideUrl = next.length > 0 ? next : null;
  if (overrideUrl) {
    await AsyncStorage.setItem(STORAGE_KEY, overrideUrl);
    return;
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}
