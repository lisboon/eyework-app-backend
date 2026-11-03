import { Global, Module } from '@nestjs/common';
import { AuthUserService } from '@/modules/users/service/auth.user.service';
import { TokenService } from '@/modules/users/service/token/token.service';
import { AUTH_CONFIG, type AuthConfig, authConfigFromEnv } from './auth.config';
import { AuthGuard } from './auth-guard';

@Global()
@Module({
  providers: [
    { provide: AUTH_CONFIG, useFactory: () => authConfigFromEnv(process.env) },
    {
      provide: AuthUserService,
      useFactory: (config: AuthConfig) =>
        new AuthUserService(
          new TokenService(config.jwtSecret, config.jwtExpiresInSeconds),
        ),
      inject: [AUTH_CONFIG],
    },
    AuthGuard,
  ],
  exports: [AUTH_CONFIG, AuthUserService, AuthGuard],
})
export class AuthModule {}
