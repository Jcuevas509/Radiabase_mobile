import * as SecureStore from 'expo-secure-store';
import { createDeviceId } from 'utils/create-device-id';

const DEVICE_ID_KEY = 'sunnected-device-id';

/**
 * Returns a stable device id, creating and persisting one on first launch.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existingDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }
  const deviceId = createDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}
