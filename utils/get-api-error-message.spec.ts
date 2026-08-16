import axios from 'axios';
import { getApiErrorMessage } from './get-api-error-message';

describe('getApiErrorMessage', () => {
  it('returns the fallback for a non-API error', () => {
    const actualMessage = getApiErrorMessage(new Error('boom'), 'Could not send a reset link.');
    expect(actualMessage).toBe('Could not send a reset link.');
  });

  it('reads a string message from an axios response', () => {
    const inputError = new axios.AxiosError('Request failed');
    inputError.response = {
      data: { message: 'No account found with this email' },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: { headers: {} as never },
    };
    const actualMessage = getApiErrorMessage(inputError, 'fallback');
    expect(actualMessage).toBe('No account found with this email');
  });
});
