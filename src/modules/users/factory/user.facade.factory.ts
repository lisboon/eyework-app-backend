import type { PrismaClient } from '@/infra/database/generated/prisma/client';
import { UserFacade } from '../facade/user.facade';
import { UserRepository } from '../repository/user.repository';
import type { AuthUserServiceInterface } from '../service/auth.user.service';
import { FindMeUseCase } from '../usecase/find-me/find-me.usecase';
import { LoginUseCase } from '../usecase/login/login.usecase';
import { SignUpUseCase } from '../usecase/signup/signup.usecase';

export class UserFacadeFactory {
  static create(
    prisma: PrismaClient,
    authUserService: AuthUserServiceInterface,
  ): UserFacade {
    const userRepository = new UserRepository(prisma);

    return new UserFacade(
      new SignUpUseCase(userRepository, authUserService),
      new LoginUseCase(userRepository, authUserService),
      new FindMeUseCase(userRepository),
    );
  }
}
