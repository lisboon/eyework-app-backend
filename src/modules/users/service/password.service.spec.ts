import bcrypt from 'bcrypt';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should hash the password with bcrypt cost 10', async () => {
    const hash = await service.hash('correct-horse-battery');

    expect(hash).not.toBe('correct-horse-battery');
    expect(bcrypt.getRounds(hash)).toBe(10);
    await expect(bcrypt.compare('correct-horse-battery', hash)).resolves.toBe(
      true,
    );
  });

  it('should refuse to hash a password that bcrypt would truncate', async () => {
    await expect(service.hash('é'.repeat(37))).rejects.toThrow(
      'Password longer than 72 bytes',
    );
  });

  it('should compare a password with its hash', async () => {
    const hash = await service.hash('correct-horse-battery');

    await expect(service.compare('correct-horse-battery', hash)).resolves.toBe(
      true,
    );
    await expect(service.compare('wrong-password', hash)).resolves.toBe(false);
  });

  it('should not accept a longer password that starts with the stored one, and still run bcrypt once', async () => {
    const password = 'a'.repeat(72);
    const hash = await service.hash(password);
    await expect(service.compare(password, hash)).resolves.toBe(true);
    const compare = jest.spyOn(bcrypt, 'compare');

    await expect(service.compare(`${password}-extra`, hash)).resolves.toBe(
      false,
    );
    expect(compare).toHaveBeenCalledTimes(1);
  });

  it('should still run bcrypt with the same cost and return false when there is no stored hash', async () => {
    const storedHash = await service.hash('correct-horse-battery');
    const compare = jest.spyOn(bcrypt, 'compare');

    await expect(
      service.compare('correct-horse-battery', undefined),
    ).resolves.toBe(false);
    expect(compare).toHaveBeenCalledTimes(1);
    expect(bcrypt.getRounds(compare.mock.calls[0][1] as string)).toBe(
      bcrypt.getRounds(storedHash),
    );
  });
});
