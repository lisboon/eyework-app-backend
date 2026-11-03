import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import {
  RefreshToken,
  type RefreshTokenProps,
} from '../../domain/refresh-token.entity';
import { User, type UserProps } from '../../domain/user.entity';
import { RefreshUseCase } from './refresh.usecase';

describe('RefreshUseCase', () => {
  const input = { refreshToken: 'refresh-token' };
  const session = {
    accessToken: 'access-token',
    refreshToken: 'next-refresh-token',
    refreshTokenExpiresAt: new Date('2026-12-03T00:00:00.000Z'),
  };

  const makeToken = (overrides: Partial<RefreshTokenProps> = {}) =>
    new RefreshToken({
      id: 'token-1',
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: RefreshToken.hash('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      ...overrides,
    });

  const makeUser = (overrides: Partial<UserProps> = {}) =>
    new User({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'hash',
      ...overrides,
    });

  const makeSut = (
    token: RefreshToken | null = makeToken(),
    user: User | null = makeUser(),
    claimed = true,
  ) => {
    const refreshTokenGateway = {
      findByTokenHash: jest.fn().mockResolvedValue(token),
      revoke: jest.fn().mockResolvedValue(claimed),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
    };
    const userGateway = {
      findById: jest.fn().mockResolvedValue(user),
    };
    const sessionService = {
      issue: jest.fn().mockResolvedValue(session),
    };
    const useCase = new RefreshUseCase(
      refreshTokenGateway,
      userGateway,
      sessionService,
    );
    return { useCase, refreshTokenGateway, userGateway, sessionService };
  };

  const rejection = (useCase: RefreshUseCase) =>
    useCase.execute(input).catch((e: unknown) => e);

  const expectInvalidToken = (error: unknown) => {
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).message).toBe('Invalid refresh token');
  };

  it('should revoke the token used and issue the next one in the same family', async () => {
    const { useCase, refreshTokenGateway, userGateway, sessionService } =
      makeSut();

    await expect(useCase.execute(input)).resolves.toEqual(session);
    expect(refreshTokenGateway.findByTokenHash).toHaveBeenCalledWith(
      RefreshToken.hash('refresh-token'),
    );
    expect(refreshTokenGateway.revoke).toHaveBeenCalledWith('token-1');
    expect(userGateway.findById).toHaveBeenCalledWith('user-1');
    expect(sessionService.issue).toHaveBeenCalledWith('user-1', 'family-1');
    expect(refreshTokenGateway.revokeFamily).not.toHaveBeenCalled();
  });

  it.each([
    ['is unknown', null],
    ['has expired', makeToken({ expiresAt: new Date(Date.now() - 1000) })],
  ])(
    'should reject a token that %s without touching the family',
    async (_, token) => {
      const { useCase, refreshTokenGateway, sessionService } = makeSut(token);

      expectInvalidToken(await rejection(useCase));
      expect(refreshTokenGateway.revoke).not.toHaveBeenCalled();
      expect(refreshTokenGateway.revokeFamily).not.toHaveBeenCalled();
      expect(sessionService.issue).not.toHaveBeenCalled();
    },
  );

  it('should revoke the whole family when a revoked token comes back', async () => {
    const { useCase, refreshTokenGateway, sessionService } = makeSut(
      makeToken({ revokedAt: new Date() }),
    );

    expectInvalidToken(await rejection(useCase));
    expect(refreshTokenGateway.revoke).not.toHaveBeenCalled();
    expect(refreshTokenGateway.revokeFamily).toHaveBeenCalledWith('family-1');
    expect(sessionService.issue).not.toHaveBeenCalled();
  });

  it('should revoke the whole family when another request rotated the token first', async () => {
    const { useCase, refreshTokenGateway, sessionService } = makeSut(
      makeToken(),
      makeUser(),
      false,
    );

    expectInvalidToken(await rejection(useCase));
    expect(refreshTokenGateway.revoke).toHaveBeenCalledWith('token-1');
    expect(refreshTokenGateway.revokeFamily).toHaveBeenCalledWith('family-1');
    expect(sessionService.issue).not.toHaveBeenCalled();
  });

  it.each([
    ['does not exist', null],
    ['is inactive', makeUser({ active: false })],
    ['was deleted', makeUser({ deletedAt: new Date() })],
  ])('should reject when the account %s', async (_, user) => {
    const { useCase, sessionService } = makeSut(makeToken(), user);

    expectInvalidToken(await rejection(useCase));
    expect(sessionService.issue).not.toHaveBeenCalled();
  });
});
