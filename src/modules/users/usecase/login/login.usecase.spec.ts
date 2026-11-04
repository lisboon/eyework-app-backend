import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { User, type UserProps } from '../../domain/user.entity';
import { LoginUseCase } from './login.usecase';

describe('LoginUseCase', () => {
  const input = {
    email: ' Ana@Example.com ',
    password: 'correct-horse-battery',
  };
  const session = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    refreshTokenExpiresAt: new Date('2026-12-03T00:00:00.000Z'),
  };

  const makeUser = (overrides: Partial<UserProps> = {}) =>
    new User({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'stored-hash',
      ...overrides,
    });

  const makeSut = (user: User | null, passwordMatches = true) => {
    const userGateway = {
      findByEmail: jest.fn().mockResolvedValue(user),
    };
    const authService = {
      comparePassword: jest.fn().mockResolvedValue(passwordMatches),
    };
    const sessionService = {
      start: jest.fn().mockResolvedValue(session),
    };
    const useCase = new LoginUseCase(userGateway, authService, sessionService);
    return { useCase, userGateway, authService, sessionService };
  };

  it('should start a session when the password matches', async () => {
    const { useCase, userGateway, authService, sessionService } =
      makeSut(makeUser());

    await expect(useCase.execute(input)).resolves.toEqual(session);
    expect(userGateway.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(authService.comparePassword).toHaveBeenCalledWith(
      'correct-horse-battery',
      'stored-hash',
    );
    expect(sessionService.start).toHaveBeenCalledWith('user-1');
  });

  it('should still compare the password when the email is not registered', async () => {
    const { useCase, authService } = makeSut(null, false);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(BadLoginError);
    expect(authService.comparePassword).toHaveBeenCalledWith(
      'correct-horse-battery',
      undefined,
    );
  });

  it.each([
    ['the email is not registered', null, false],
    ['the password is wrong', makeUser(), false],
    ['the account is inactive', makeUser({ active: false }), true],
    ['the account was deleted', makeUser({ deletedAt: new Date() }), true],
  ])(
    'should reject with the same error when %s',
    async (_, user, passwordMatches) => {
      const { useCase, authService, sessionService } = makeSut(
        user,
        passwordMatches,
      );

      const error = await useCase.execute(input).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadLoginError);
      expect((error as BadLoginError).message).toBe(
        'Invalid email or password',
      );
      expect(authService.comparePassword).toHaveBeenCalledTimes(1);
      expect(sessionService.start).not.toHaveBeenCalled();
    },
  );
});
