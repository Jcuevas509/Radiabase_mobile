/**
 * Returns a usable remote image URL, or null when the user has no real photo.
 */
export function pickRemoteImageUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }
  return trimmed;
}
