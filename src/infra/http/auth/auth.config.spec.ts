import { authConfigFromEnv } from './auth.config';

describe('authConfigFromEnv', () => {
  const secret = 'a'.repeat(32);

  it('should read the secret and default the token lifetime to 15 minutes', () => {
    expect(authConfigFromEnv({ JWT_SECRET: secret })).toEqual({
      jwtSecret: secret,
      jwtExpiresInSeconds: 900,
    });
  });

  it.each([
    ['30s', 30],
    ['15m', 900],
    ['2h', 7200],
    ['1d', 86400],
  ])('should convert %s to %i seconds', (value, seconds) => {
    const config = authConfigFromEnv({
      JWT_SECRET: secret,
      JWT_EXPIRES_IN: value,
    });

    expect(config.jwtExpiresInSeconds).toBe(seconds);
  });

  it.each([[undefined], ['short-secret']])(
    'should reject a missing or short secret (%s)',
    (value) => {
      expect(() => authConfigFromEnv({ JWT_SECRET: value })).toThrow(
        'JWT_SECRET must have at least 32 characters',
      );
    },
  );

  it.each([['15'], ['0m'], ['15 minutes'], ['1w']])(
    'should reject the lifetime "%s"',
    (value) => {
      expect(() =>
        authConfigFromEnv({ JWT_SECRET: secret, JWT_EXPIRES_IN: value }),
      ).toThrow('JWT_EXPIRES_IN');
    },
  );
});
