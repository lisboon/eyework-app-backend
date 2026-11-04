import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { RefreshToken } from '../domain/refresh-token.entity';
import type { RefreshTokenGateway } from '../gateway/refresh-token.gateway';
import type { TokenServiceInterface } from './token/token.service';

export interface Session {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface SessionServiceInterface {
  start(userId: string, trx?: TransactionContext): Promise<Session>;
  renew(current: RefreshToken, trx?: TransactionContext): Promise<Session>;
}

interface FamilyOfNextToken {
  userId: string;
  familyId?: string;
  expiresAt: Date;
}

export class SessionService implements SessionServiceInterface {
  constructor(
    private readonly refreshTokenGateway: Pick<RefreshTokenGateway, 'create'>,
    private readonly tokenService: Pick<TokenServiceInterface, 'generateToken'>,
    private readonly refreshTokenTtlSeconds: number,
  ) {}

  start(userId: string, trx?: TransactionContext): Promise<Session> {
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlSeconds * 1000);
    return this.issue({ userId, expiresAt }, trx);
  }

  renew(current: RefreshToken, trx?: TransactionContext): Promise<Session> {
    return this.issue(
      {
        userId: current.userId,
        familyId: current.familyId,
        expiresAt: current.expiresAt,
      },
      trx,
    );
  }

  private async issue(
    family: FamilyOfNextToken,
    trx?: TransactionContext,
  ): Promise<Session> {
    const refreshToken = RefreshToken.generate();
    const record = new RefreshToken({
      ...family,
      tokenHash: RefreshToken.hash(refreshToken),
    });
    await this.refreshTokenGateway.create(record, trx);

    return {
      accessToken: this.tokenService.generateToken({ sub: family.userId }),
      refreshToken,
      refreshTokenExpiresAt: record.expiresAt,
    };
  }
}
