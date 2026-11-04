import { RefreshToken } from '../../domain/refresh-token.entity';
import type { RefreshTokenGateway } from '../../gateway/refresh-token.gateway';
import type {
  LogoutInputDto,
  LogoutUseCaseInterface,
} from './logout.usecase.dto';

export class LogoutUseCase implements LogoutUseCaseInterface {
  constructor(
    private readonly refreshTokenGateway: Pick<
      RefreshTokenGateway,
      'findByTokenHash' | 'revokeFamily'
    >,
  ) {}

  async execute(input: LogoutInputDto): Promise<void> {
    const current = await this.refreshTokenGateway.findByTokenHash(
      RefreshToken.hash(input.refreshToken),
    );
    if (current) {
      await this.refreshTokenGateway.revokeFamily(current.familyId);
    }
  }
}
