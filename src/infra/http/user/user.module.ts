import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from '@/infra/database/prisma.service';
import { UserFacade } from '@/modules/users/facade/user.facade';
import { UserFacadeFactory } from '@/modules/users/factory/user.facade.factory';
import { AuthUserService } from '@/modules/users/service/auth.user.service';
import { AUTH_CONFIG, type AuthConfig } from '../auth/auth.config';
import { RATE_LIMITS } from '../auth/rate-limit.config';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: RATE_LIMITS, setHeaders: false }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserFacade,
      useFactory: (
        prisma: PrismaService,
        authUserService: AuthUserService,
        config: AuthConfig,
      ) =>
        UserFacadeFactory.create(
          prisma,
          authUserService,
          config.refreshTokenExpiresInSeconds,
        ),
      inject: [PrismaService, AuthUserService, AUTH_CONFIG],
    },
  ],
})
export class UserModule {}
