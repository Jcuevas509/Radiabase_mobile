import { Platform } from 'react-native';

const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3010/api';
const IOS_SIMULATOR_API_URL = 'http://localhost:3010/api';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? ANDROID_EMULATOR_API_URL : IOS_SIMULATOR_API_URL);
