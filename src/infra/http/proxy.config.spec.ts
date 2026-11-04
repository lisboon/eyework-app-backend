import { trustProxyFromEnv } from './proxy.config';

describe('trustProxyFromEnv', () => {
  it('should trust no proxy by default', () => {
    expect(trustProxyFromEnv({})).toBe(0);
  });

  it.each([
    ['0', 0],
    ['1', 1],
    ['2', 2],
  ])('should read %s as %i proxies', (value, hops) => {
    expect(trustProxyFromEnv({ TRUST_PROXY: value })).toBe(hops);
  });

  it.each([['true'], ['-1'], ['1.5'], [''], ['10.0.0.1']])(
    'should reject "%s"',
    (value) => {
      expect(() => trustProxyFromEnv({ TRUST_PROXY: value })).toThrow(
        'TRUST_PROXY must be the number of proxies',
      );
    },
  );
});
