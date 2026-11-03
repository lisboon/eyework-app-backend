import { RefreshToken } from '../../domain/refresh-token.entity';
import { LogoutUseCase } from './logout.usecase';

describe('LogoutUseCase', () => {
  const makeSut = (token: RefreshToken | null) => {
    const refreshTokenGateway = {
      findByTokenHash: jest.fn().mockResolvedValue(token),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
    };
    return {
      useCase: new LogoutUseCase(refreshTokenGateway),
      refreshTokenGateway,
    };
  };

  it('should revoke the family of a known token', async () => {
    const token = new RefreshToken({
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: RefreshToken.hash('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const { useCase, refreshTokenGateway } = makeSut(token);

    await useCase.execute({ refreshToken: 'refresh-token' });

    expect(refreshTokenGateway.findByTokenHash).toHaveBeenCalledWith(
      RefreshToken.hash('refresh-token'),
    );
    expect(refreshTokenGateway.revokeFamily).toHaveBeenCalledWith('family-1');
  });

  it('should do nothing for an unknown token', async () => {
    const { useCase, refreshTokenGateway } = makeSut(null);

    await useCase.execute({ refreshToken: 'unknown' });

    expect(refreshTokenGateway.revokeFamily).not.toHaveBeenCalled();
  });
});
