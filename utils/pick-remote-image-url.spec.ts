import { pickRemoteImageUrl } from './pick-remote-image-url';

describe('pickRemoteImageUrl', () => {
  it('returns a http url', () => {
    expect(pickRemoteImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('returns null for missing or non-http values', () => {
    expect(pickRemoteImageUrl(null)).toBeNull();
    expect(pickRemoteImageUrl('')).toBeNull();
    expect(pickRemoteImageUrl('avatars/user-1.png')).toBeNull();
  });
});
