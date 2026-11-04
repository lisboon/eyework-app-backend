import type { RefreshTokenGateway } from '../../gateway/refresh-token.gateway';
import type {
  DeleteExpiredSessionsOutputDto,
  DeleteExpiredSessionsUseCaseInterface,
} from './delete-expired-sessions.usecase.dto';

export class DeleteExpiredSessionsUseCase implements DeleteExpiredSessionsUseCaseInterface {
  constructor(
    private readonly refreshTokenGateway: Pick<
      RefreshTokenGateway,
      'deleteExpiredFamilies'
    >,
  ) {}

  async execute(): Promise<DeleteExpiredSessionsOutputDto> {
    return {
      deleted: await this.refreshTokenGateway.deleteExpiredFamilies(new Date()),
    };
  }
}
