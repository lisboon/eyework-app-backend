import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { RefreshToken } from '../domain/refresh-token.entity';
import type { RefreshTokenGateway } from '../gateway/refresh-token.gateway';
import type { AuthUserServiceInterface } from './auth.user.service';

export interface Session {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface SessionServiceInterface {
  start(userId: string, trx?: TransactionContext): Promise<Session>;
  renew(userId: string, familyId: string): Promise<Session>;
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

  start(userId: string, trx?: TransactionContext): Promise<Session> {
    return this.issue(userId, { trx });
  }

  renew(userId: string, familyId: string): Promise<Session> {
    return this.issue(userId, { familyId });
  }

  private async issue(
    userId: string,
    { familyId, trx }: { familyId?: string; trx?: TransactionContext },
  ): Promise<Session> {
    const refreshToken = RefreshToken.generate();
    const record = new RefreshToken({
      userId,
      familyId,
      tokenHash: RefreshToken.hash(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshTokenTtlSeconds * 1000),
    });
    await this.refreshTokenGateway.create(record, trx);

    return {
      accessToken: this.authService.generateToken({ sub: userId }),
      refreshToken,
      refreshTokenExpiresAt: record.expiresAt,
    };
  }
}
