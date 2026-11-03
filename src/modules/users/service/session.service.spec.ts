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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should store only the hash of a new refresh token that expires after the ttl', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-11-03T12:00:00.000Z').getTime());
    const { service, refreshTokenGateway, authService } = makeSut();

    const session = await service.issue('user-1');

    const stored: RefreshToken = refreshTokenGateway.create.mock.calls[0][0];
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

  it('should keep the family when it replaces a token', async () => {
    const { service, refreshTokenGateway } = makeSut();

    await service.issue('user-1', 'family-1');

    const stored: RefreshToken = refreshTokenGateway.create.mock.calls[0][0];
    expect(stored.familyId).toBe('family-1');
  });
});
