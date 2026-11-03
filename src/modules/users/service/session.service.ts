import { RefreshToken } from '../domain/refresh-token.entity';
import type { RefreshTokenGateway } from '../gateway/refresh-token.gateway';
import type { AuthUserServiceInterface } from './auth.user.service';

export interface Session {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface SessionServiceInterface {
  issue(userId: string, familyId?: string): Promise<Session>;
}

export class SessionService implements SessionServiceInterface {
  constructor(
    private readonly refreshTokenGateway: Pick<RefreshTokenGateway, 'create'>,
    private readonly authService: Pick<
      AuthUserServiceInterface,
      'generateToken'
    >,
    private readonly refreshTokenTtlSeconds: number,
  ) {}

  async issue(userId: string, familyId?: string): Promise<Session> {
    const refreshToken = RefreshToken.generate();
    const record = new RefreshToken({
      userId,
      familyId,
      tokenHash: RefreshToken.hash(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
    });
    await this.refreshTokenGateway.create(record);

    return {
      accessToken: this.authService.generateToken({ sub: userId }),
      refreshToken,
      refreshTokenExpiresAt: record.expiresAt,
    };
  }
}
