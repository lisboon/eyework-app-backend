import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { User } from '../../domain/user.entity';
import type { UserGateway } from '../../gateway/user.gateway';
import type { AuthUserServiceInterface } from '../../service/auth.user.service';
import type { SessionServiceInterface } from '../../service/session.service';
import type {
  LoginInputDto,
  LoginOutputDto,
  LoginUseCaseInterface,
} from './login.usecase.dto';

export class LoginUseCase implements LoginUseCaseInterface {
  constructor(
    private readonly userGateway: Pick<UserGateway, 'findByEmail'>,
    private readonly authService: Pick<
      AuthUserServiceInterface,
      'comparePassword'
    >,
    private readonly sessionService: Pick<SessionServiceInterface, 'start'>,
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const user = await this.userGateway.findByEmail(
      User.normalizeEmail(input.email),
    );
    const passwordMatches = await this.authService.comparePassword(
      input.password,
      user?.password,
    );
    if (!user || !passwordMatches || !user.canAuthenticate()) {
      throw new BadLoginError();
    }

    return this.sessionService.start(user.id);
  }
}
