import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';
import type { TransactionManager } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { User } from '../../domain/user.entity';
import { emailAlreadyRegisteredError } from '../../domain/user.errors';
import type { UserGateway } from '../../gateway/user.gateway';
import type { AuthUserServiceInterface } from '../../service/auth.user.service';
import type { SessionServiceInterface } from '../../service/session.service';
import type {
  SignUpInputDto,
  SignUpOutputDto,
  SignUpUseCaseInterface,
} from './signup.usecase.dto';

export class SignUpUseCase implements SignUpUseCaseInterface {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly userGateway: Pick<UserGateway, 'findByEmail' | 'create'>,
    private readonly authService: Pick<
      AuthUserServiceInterface,
      'hashPassword'
    >,
    private readonly sessionService: Pick<SessionServiceInterface, 'start'>,
  ) {}

  async execute(input: SignUpInputDto): Promise<SignUpOutputDto> {
    if (await this.userGateway.findByEmail(User.normalizeEmail(input.email))) {
      throw emailAlreadyRegisteredError();
    }

    const user = User.create({
      name: input.name,
      email: input.email,
      password: await this.authService.hashPassword(input.password),
    });

    if (user.notification.hasErrors()) {
      throw new EntityValidationError(user.notification.toJSON());
    }

    const session = await this.transactionManager.execute(async (trx) => {
      await this.userGateway.create(user, trx);
      return this.sessionService.start(user.id, trx);
    });

    return { id: user.id, name: user.name, email: user.email, ...session };
  }
}
