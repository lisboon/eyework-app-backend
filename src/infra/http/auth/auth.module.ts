import { Global, Module } from '@nestjs/common';
import { AuthUserService } from '@/modules/users/service/auth.user.service';
import { TokenService } from '@/modules/users/service/token/token.service';
import { authConfigFromEnv } from './auth.config';
import { AuthGuard } from './auth-guard';

@Global()
@Module({
  providers: [
    {
      provide: AuthUserService,
      useFactory: () => {
        const { jwtSecret, jwtExpiresInSeconds } = authConfigFromEnv(
          process.env,
        );
        return new AuthUserService(
          new TokenService(jwtSecret, jwtExpiresInSeconds),
        );
      },
    },
    AuthGuard,
  ],
  exports: [AuthUserService, AuthGuard],
})
export class AuthModule {}
