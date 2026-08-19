const { AxiosHeaders } = require('axios');

jest.mock('services/device-identity', () => ({
  getOrCreateDeviceId: jest.fn().mockResolvedValue('device-1'),
}));

const { apiClient, setAccessToken } = require('services/api-client');

function getRequestInterceptor() {
  return apiClient.interceptors.request.handlers[0].fulfilled;
}

describe('apiClient authorization', () => {
  beforeEach(() => setAccessToken(null));

  it('does not overwrite an explicit provisional login token', async () => {
    setAccessToken('stale-global-token');
    const config = {
      headers: new AxiosHeaders({ Authorization: 'Bearer new-login-token' }),
      method: 'get',
      url: '/auth/me',
    };

    const result = await getRequestInterceptor()(config);

    expect(result.headers.get('Authorization')).toBe('Bearer new-login-token');
  });

  it('adds the persisted token when a request has no explicit authorization', async () => {
    setAccessToken('persisted-token');
    const config = {
      headers: new AxiosHeaders(),
      method: 'get',
      url: '/leads',
    };

    const result = await getRequestInterceptor()(config);

    expect(result.headers.get('Authorization')).toBe('Bearer persisted-token');
  });
});
