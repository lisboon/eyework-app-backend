import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import type { UserGateway } from '../../gateway/user.gateway';
import type {
  FindMeInputDto,
  FindMeOutputDto,
  FindMeUseCaseInterface,
} from './find-me.usecase.dto';

export class FindMeUseCase implements FindMeUseCaseInterface {
  constructor(private readonly userGateway: Pick<UserGateway, 'findById'>) {}

  async execute(input: FindMeInputDto): Promise<FindMeOutputDto> {
    const user = await this.userGateway.findById(input.id);
    if (!user || !user.canAuthenticate()) {
      throw new UnauthorizedError();
    }

    return { id: user.id, name: user.name, email: user.email };
  }
}
