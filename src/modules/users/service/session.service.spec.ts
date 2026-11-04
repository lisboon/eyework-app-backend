import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { RefreshToken } from '../domain/refresh-token.entity';
import { SessionService } from './session.service';

describe('SessionService', () => {
  const makeSut = () => {
    const refreshTokenGateway = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    const authService = {
      generateToken: jest.fn().mockReturnValue('access-token'),
    };
    const service = new SessionService(refreshTokenGateway, authService, 3600);
    return { service, refreshTokenGateway, authService };
  };

  const storedToken = (gateway: { create: jest.Mock }): RefreshToken =>
    gateway.create.mock.calls[0][0];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should store only the hash of a new refresh token that expires after the ttl', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-11-03T12:00:00.000Z').getTime());
    const { service, refreshTokenGateway, authService } = makeSut();

    const session = await service.start('user-1');

    const stored = storedToken(refreshTokenGateway);
    expect(stored.userId).toBe('user-1');
    expect(stored.tokenHash).toBe(RefreshToken.hash(session.refreshToken));
    expect(stored.tokenHash).not.toBe(session.refreshToken);
    expect(stored.expiresAt).toEqual(new Date('2026-11-03T13:00:00.000Z'));
    expect(authService.generateToken).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(session).toEqual({
      accessToken: 'access-token',
      refreshToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      refreshTokenExpiresAt: stored.expiresAt,
    });
  });

  it('should open a new family on every start and store it in the given transaction', async () => {
    const { service, refreshTokenGateway } = makeSut();
    const trx = new (class extends TransactionContext {
      constructor() {
        super();
      }
    })();

    await service.start('user-1', trx);
    await service.start('user-1');

    const [first, second] = refreshTokenGateway.create.mock.calls;
    expect(first[1]).toBe(trx);
    expect(second[1]).toBeUndefined();
    expect(first[0].familyId).not.toBe(second[0].familyId);
  });

  it('should keep the family when it renews a session, inside the given transaction', async () => {
    const { service, refreshTokenGateway } = makeSut();
    const trx = new (class extends TransactionContext {
      constructor() {
        super();
      }
    })();

    await service.renew('user-1', 'family-1', trx);

    expect(storedToken(refreshTokenGateway).familyId).toBe('family-1');
    expect(refreshTokenGateway.create.mock.calls[0][1]).toBe(trx);
  });
});
