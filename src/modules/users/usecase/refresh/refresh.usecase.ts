import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import { RefreshToken } from '../../domain/refresh-token.entity';
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
    private readonly refreshTokenGateway: Pick<
      RefreshTokenGateway,
      'findByTokenHash' | 'revoke' | 'revokeFamily'
    >,
    private readonly userGateway: Pick<UserGateway, 'findById'>,
    private readonly sessionService: SessionServiceInterface,
  ) {}

  async execute(input: RefreshInputDto): Promise<RefreshOutputDto> {
    const current = await this.refreshTokenGateway.findByTokenHash(
      RefreshToken.hash(input.refreshToken),
    );
    if (!current || current.isExpired(new Date())) {
      throw new UnauthorizedError(INVALID_REFRESH_TOKEN);
    }

    const rotated =
      !current.isRevoked() &&
      (await this.refreshTokenGateway.revoke(current.id));
    if (!rotated) {
      await this.refreshTokenGateway.revokeFamily(current.familyId);
      throw new UnauthorizedError(INVALID_REFRESH_TOKEN);
    }

    const user = await this.userGateway.findById(current.userId);
    if (!user || !user.canAuthenticate()) {
      throw new UnauthorizedError(INVALID_REFRESH_TOKEN);
    }

    return this.sessionService.issue(user.id, current.familyId);
  }
}
