const { apiClient } = require('services/api-client');
const { loginWithPassword } = require('services/auth-api');

jest.mock('services/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('utils/map-api-user', () => ({
  mapApiUserToSessionUser: jest.fn(() => ({ id: '42' })),
}));

describe('loginWithPassword token lifecycle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the provisional token only on auth/me until persistence', async () => {
    apiClient.post.mockResolvedValue({ data: { access_token: 'server-token' } });
    apiClient.get.mockResolvedValue({ data: { id: 42 } });

    await expect(loginWithPassword({ email: ' rep@example.com ', password: 'secret' }))
      .resolves.toEqual(expect.objectContaining({ token: 'server-token' }));
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer server-token' },
    });
  });

  it('clears the provisional token when auth/me fails', async () => {
    apiClient.post.mockResolvedValue({ data: { access_token: 'server-token' } });
    apiClient.get.mockRejectedValue(new Error('profile unavailable'));

    await expect(loginWithPassword({ email: 'rep@example.com', password: 'secret' }))
      .rejects.toThrow('profile unavailable');
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer server-token' },
    });
  });
});
