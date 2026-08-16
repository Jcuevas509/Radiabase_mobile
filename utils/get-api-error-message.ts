import axios from 'axios';

/**
 * Reads a Nest/API error message when present.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }
  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  if (Array.isArray(message) && message.length > 0) {
    return message.filter((item: unknown) => typeof item === 'string').join(' ');
  }
  return fallback;
}
