import type { PrismaClient } from '@/infra/database/generated/prisma/client';
import { UserFacade } from '../facade/user.facade';
import { UserRepository } from '../repository/user.repository';
import { AuthUserService } from '../service/auth.user.service';
import { SignUpUseCase } from '../usecase/signup/signup.usecase';

export class UserFacadeFactory {
  static create(prisma: PrismaClient): UserFacade {
    const userRepository = new UserRepository(prisma);
    const authUserService = new AuthUserService();

    return new UserFacade(new SignUpUseCase(userRepository, authUserService));
  }
}
