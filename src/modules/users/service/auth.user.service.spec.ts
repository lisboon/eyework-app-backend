import bcrypt from 'bcrypt';
import { AuthUserService } from './auth.user.service';

describe('AuthUserService', () => {
  const makeSut = () => {
    const tokenService = {
      generateToken: jest.fn().mockReturnValue('access-token'),
      verifyToken: jest.fn().mockReturnValue({ sub: 'user-1' }),
    };
    return { service: new AuthUserService(tokenService), tokenService };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should hash the password with bcrypt cost 10', async () => {
    const { service } = makeSut();

    const hash = await service.hashPassword('correct-horse-battery');

    expect(hash).not.toBe('correct-horse-battery');
    expect(bcrypt.getRounds(hash)).toBe(10);
    await expect(bcrypt.compare('correct-horse-battery', hash)).resolves.toBe(
      true,
    );
  });

  it('should refuse to hash a password that bcrypt would truncate', async () => {
    const { service } = makeSut();

    await expect(service.hashPassword('é'.repeat(37))).rejects.toThrow(
      'Password longer than 72 bytes',
    );
  });

  it('should compare a password with its hash', async () => {
    const { service } = makeSut();
    const hash = await service.hashPassword('correct-horse-battery');

    await expect(
      service.comparePassword('correct-horse-battery', hash),
    ).resolves.toBe(true);
    await expect(service.comparePassword('wrong-password', hash)).resolves.toBe(
      false,
    );
  });

  it('should not accept a longer password that starts with the stored one, and still run bcrypt once', async () => {
    const { service } = makeSut();
    const password = 'a'.repeat(72);
    const hash = await service.hashPassword(password);
    await expect(service.comparePassword(password, hash)).resolves.toBe(true);
    const compare = jest.spyOn(bcrypt, 'compare');

    await expect(
      service.comparePassword(`${password}-extra`, hash),
    ).resolves.toBe(false);
    expect(compare).toHaveBeenCalledTimes(1);
  });

  it('should still run bcrypt with the same cost and return false when there is no stored hash', async () => {
    const { service } = makeSut();
    const storedHash = await service.hashPassword('correct-horse-battery');
    const compare = jest.spyOn(bcrypt, 'compare');

    await expect(
      service.comparePassword('correct-horse-battery', undefined),
    ).resolves.toBe(false);
    expect(compare).toHaveBeenCalledTimes(1);
    expect(bcrypt.getRounds(compare.mock.calls[0][1] as string)).toBe(
      bcrypt.getRounds(storedHash),
    );
  });

  it('should delegate the access token to the token service', () => {
    const { service, tokenService } = makeSut();

    expect(service.generateToken({ sub: 'user-1' })).toBe('access-token');
    expect(service.verifyToken('access-token')).toEqual({ sub: 'user-1' });
    expect(tokenService.generateToken).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(tokenService.verifyToken).toHaveBeenCalledWith('access-token');
  });
});
