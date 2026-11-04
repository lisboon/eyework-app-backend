import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import {
  TransactionContext,
  type TransactionManager,
} from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import {
  RefreshToken,
  type RefreshTokenProps,
} from '../../domain/refresh-token.entity';
import { RefreshTokenReuseError } from '../../domain/refresh-token-reuse.error';
import { User, type UserProps } from '../../domain/user.entity';
import { RefreshUseCase } from './refresh.usecase';

describe('RefreshUseCase', () => {
  const input = { refreshToken: 'refresh-token' };
  const session = {
    accessToken: 'access-token',
    refreshToken: 'next-refresh-token',
    refreshTokenExpiresAt: new Date('2026-12-03T00:00:00.000Z'),
  };
  const trx = new (class extends TransactionContext {
    constructor() {
      super();
    }
  })();

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
    const transactionManager = {
      execute: jest.fn(
        async (work: (context: TransactionContext) => Promise<unknown>) =>
          work(trx),
      ),
    };
    const refreshTokenGateway = {
      findByTokenHash: jest.fn().mockResolvedValue(token),
      revoke: jest.fn().mockResolvedValue(claimed),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
    };
    const userGateway = {
      findById: jest.fn().mockResolvedValue(user),
    };
    const sessionService = {
      renew: jest.fn().mockResolvedValue(session),
    };
    const useCase = new RefreshUseCase(
      transactionManager as unknown as TransactionManager,
      refreshTokenGateway,
      userGateway,
      sessionService,
    );
    return {
      useCase,
      transactionManager,
      refreshTokenGateway,
      userGateway,
      sessionService,
    };
  };

  const rejection = (useCase: RefreshUseCase) =>
    useCase.execute(input).catch((e: unknown) => e);

  const expectInvalidToken = (error: unknown) => {
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).message).toBe('Invalid refresh token');
  };

  const expectReuse = (error: unknown) => {
    expectInvalidToken(error);
    expect(error).toBeInstanceOf(RefreshTokenReuseError);
    expect(error).toMatchObject({ userId: 'user-1', familyId: 'family-1' });
  };

  it('should revoke the token used and store the next one of the family in one transaction', async () => {
    const {
      useCase,
      transactionManager,
      refreshTokenGateway,
      userGateway,
      sessionService,
    } = makeSut();

    await expect(useCase.execute(input)).resolves.toEqual(session);
    expect(refreshTokenGateway.findByTokenHash).toHaveBeenCalledWith(
      RefreshToken.hash('refresh-token'),
    );
    expect(userGateway.findById).toHaveBeenCalledWith('user-1');
    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(refreshTokenGateway.revoke).toHaveBeenCalledWith('token-1', trx);
    expect(sessionService.renew).toHaveBeenCalledWith(
      'user-1',
      'family-1',
      trx,
    );
    expect(refreshTokenGateway.revokeFamily).not.toHaveBeenCalled();
  });

  it.each([
    ['is unknown', null],
    ['has expired', makeToken({ expiresAt: new Date(Date.now() - 1000) })],
    ['belongs to a revoked family', makeToken({ familyRevokedAt: new Date() })],
  ])(
    'should reject a token that %s without touching the family',
    async (_, token) => {
      const { useCase, transactionManager, refreshTokenGateway } =
        makeSut(token);

      expectInvalidToken(await rejection(useCase));
      expect(transactionManager.execute).not.toHaveBeenCalled();
      expect(refreshTokenGateway.revokeFamily).not.toHaveBeenCalled();
    },
  );

  it('should revoke the whole family when a revoked token comes back', async () => {
    const { useCase, transactionManager, refreshTokenGateway } = makeSut(
      makeToken({ revokedAt: new Date() }),
    );

    expectReuse(await rejection(useCase));
    expect(transactionManager.execute).not.toHaveBeenCalled();
    expect(refreshTokenGateway.revokeFamily).toHaveBeenCalledWith('family-1');
  });

  it('should revoke the whole family when another request rotated the token first', async () => {
    const { useCase, refreshTokenGateway, sessionService } = makeSut(
      makeToken(),
      makeUser(),
      false,
    );

    expectReuse(await rejection(useCase));
    expect(refreshTokenGateway.revoke).toHaveBeenCalledWith('token-1', trx);
    expect(refreshTokenGateway.revokeFamily).toHaveBeenCalledWith('family-1');
    expect(sessionService.renew).not.toHaveBeenCalled();
  });

  it.each([
    ['does not exist', null],
    ['is inactive', makeUser({ active: false })],
    ['was deleted', makeUser({ deletedAt: new Date() })],
  ])('should reject when the account %s', async (_, user) => {
    const { useCase, transactionManager, sessionService } = makeSut(
      makeToken(),
      user,
    );

    const error = await rejection(useCase);

    expectInvalidToken(error);
    expect(error).not.toBeInstanceOf(RefreshTokenReuseError);
    expect(transactionManager.execute).not.toHaveBeenCalled();
    expect(sessionService.renew).not.toHaveBeenCalled();
  });
});
