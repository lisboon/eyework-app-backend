import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';
import { User } from '../../domain/user.entity';
import { emailAlreadyRegisteredError } from '../../domain/user.errors';
import type { UserGateway } from '../../gateway/user.gateway';
import type { AuthUserServiceInterface } from '../../service/auth.user.service';
import type {
  SignUpInputDto,
  SignUpOutputDto,
  SignUpUseCaseInterface,
} from './signup.usecase.dto';

export class SignUpUseCase implements SignUpUseCaseInterface {
  constructor(
    private readonly userGateway: UserGateway,
    private readonly authService: AuthUserServiceInterface,
  ) {}

  async execute(input: SignUpInputDto): Promise<SignUpOutputDto> {
    const user = User.create({
      name: input.name,
      email: input.email,
      password: await this.authService.hashPassword(input.password),
    });

    if (user.notification.hasErrors()) {
      throw new EntityValidationError(user.notification.toJSON());
    }

    if (await this.userGateway.findByEmail(user.email)) {
      throw emailAlreadyRegisteredError();
    }

    await this.userGateway.create(user);

    return { id: user.id, name: user.name, email: user.email };
  }
}
