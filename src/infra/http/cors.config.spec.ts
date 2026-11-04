import { corsOriginsFromEnv } from './cors.config';

describe('corsOriginsFromEnv', () => {
  it('should read a comma-separated list of origins', () => {
    expect(
      corsOriginsFromEnv({
        CORS_ORIGINS: 'https://app.example.com, http://localhost:3000',
      }),
    ).toEqual(['https://app.example.com', 'http://localhost:3000']);
  });

  it.each([
    [undefined],
    [''],
    [' , '],
    ['*'],
    ['app.example.com'],
    ['https://app.example.com/'],
    ['https://app.example.com/login'],
    ['ftp://files.example.com'],
  ])('should reject %s', (value) => {
    expect(() => corsOriginsFromEnv({ CORS_ORIGINS: value })).toThrow(
      'CORS_ORIGINS must list origins',
    );
  });
});
