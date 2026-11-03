import { version } from 'uuid';
import { RefreshToken } from './refresh-token.entity';

describe('RefreshToken', () => {
  const expiresAt = new Date('2026-12-03T00:00:00.000Z');

  const makeToken = (revokedAt?: Date) =>
    new RefreshToken({
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt,
      revokedAt,
    });

  it('should generate a different 256-bit token in base64url each time', () => {
    const token = RefreshToken.generate();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(RefreshToken.generate()).not.toBe(token);
  });

  it('should hash a token with SHA-256', () => {
    expect(RefreshToken.hash('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('should start a new family when none is given', () => {
    const token = makeToken();

    expect(version(token.id)).toBe(7);
    expect(version(token.familyId)).toBe(7);
    expect(token.familyId).not.toBe(token.id);
    expect(token.isRevoked()).toBe(false);
  });

  it('should keep the family of the token it replaces', () => {
    const token = new RefreshToken({
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: 'hash',
      expiresAt,
    });

    expect(token.familyId).toBe('family-1');
  });

  it('should expire at its expiration date', () => {
    const token = makeToken();

    expect(token.isExpired(new Date(expiresAt.getTime() - 1))).toBe(false);
    expect(token.isExpired(expiresAt)).toBe(true);
  });

  it('should be revoked once it has a revocation date', () => {
    expect(makeToken(new Date()).isRevoked()).toBe(true);
  });
});
