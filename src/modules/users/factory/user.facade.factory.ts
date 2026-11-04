import type { PrismaClient } from '@/infra/database/generated/prisma/client';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';
import { UserFacade } from '../facade/user.facade';
import { RefreshTokenRepository } from '../repository/refresh-token.repository';
import { UserRepository } from '../repository/user.repository';
import { PasswordService } from '../service/password.service';
import { SessionService } from '../service/session.service';
import type { TokenServiceInterface } from '../service/token/token.service';
import { FindMeUseCase } from '../usecase/find-me/find-me.usecase';
import { LoginUseCase } from '../usecase/login/login.usecase';
import { LogoutUseCase } from '../usecase/logout/logout.usecase';
import { RefreshUseCase } from '../usecase/refresh/refresh.usecase';
import { SignUpUseCase } from '../usecase/signup/signup.usecase';

export class UserFacadeFactory {
  static create(
    prisma: PrismaClient,
    tokenService: TokenServiceInterface,
    refreshTokenTtlSeconds: number,
  ): UserFacade {
    const transactionManager = new PrismaTransactionManager(prisma);
    const userRepository = new UserRepository(prisma);
    const refreshTokenRepository = new RefreshTokenRepository(prisma);
    const passwordService = new PasswordService();
    const sessionService = new SessionService(
      refreshTokenRepository,
      tokenService,
      refreshTokenTtlSeconds,
    );

    return new UserFacade(
      new SignUpUseCase(
        transactionManager,
        userRepository,
        passwordService,
        sessionService,
      ),
      new LoginUseCase(userRepository, passwordService, sessionService),
      new FindMeUseCase(userRepository),
      new RefreshUseCase(
        transactionManager,
        refreshTokenRepository,
        userRepository,
        sessionService,
      ),
      new LogoutUseCase(refreshTokenRepository),
    );
  }
}
