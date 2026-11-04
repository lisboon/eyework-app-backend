import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import type { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { RefreshTokenReuseError } from '../../domain/refresh-token-reuse.error';
import type { RefreshTokenGateway } from '../../gateway/refresh-token.gateway';
import type { UserGateway } from '../../gateway/user.gateway';
import type { SessionServiceInterface } from '../../service/session.service';
import type {
  RefreshInputDto,
  RefreshOutputDto,
  RefreshUseCaseInterface,
} from './refresh.usecase.dto';

const INVALID_REFRESH_TOKEN = 'Invalid refresh token';

export class RefreshUseCase implements RefreshUseCaseInterface {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly refreshTokenGateway: Pick<
      RefreshTokenGateway,
      'findByTokenHash' | 'revoke' | 'revokeFamily'
    >,
    private readonly userGateway: Pick<UserGateway, 'findById'>,
    private readonly sessionService: Pick<SessionServiceInterface, 'renew'>,
  ) {}

  async execute(input: RefreshInputDto): Promise<RefreshOutputDto> {
    const current = await this.refreshTokenGateway.findByTokenHash(
      RefreshToken.hash(input.refreshToken),
    );
    if (
      !current ||
      current.isExpired(new Date()) ||
      current.isFamilyRevoked()
    ) {
      throw new UnauthorizedError(INVALID_REFRESH_TOKEN);
    }
    if (current.isRevoked()) {
      return this.rejectReuse(current);
    }

    const user = await this.userGateway.findById(current.userId);
    if (!user || !user.canAuthenticate()) {
      throw new UnauthorizedError(INVALID_REFRESH_TOKEN);
    }

    const session = await this.transactionManager.execute(async (trx) =>
      (await this.refreshTokenGateway.revoke(current.id, trx))
        ? this.sessionService.renew(current, trx)
        : undefined,
    );
    if (!session) {
      return this.rejectReuse(current);
    }
    return session;
  }

  private async rejectReuse(token: RefreshToken): Promise<never> {
    await this.refreshTokenGateway.revokeFamily(token.familyId);
    throw new RefreshTokenReuseError(token.userId, token.familyId);
  }
}
