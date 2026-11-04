import { Global, Module } from '@nestjs/common';
import { TokenService } from '@/modules/users/service/token/token.service';
import { AUTH_CONFIG, type AuthConfig, authConfigFromEnv } from './auth.config';
import { AuthGuard } from './auth-guard';

@Global()
@Module({
  providers: [
    { provide: AUTH_CONFIG, useFactory: () => authConfigFromEnv(process.env) },
    {
      provide: TokenService,
      useFactory: (config: AuthConfig) =>
        new TokenService(config.jwtSecret, config.jwtExpiresInSeconds),
      inject: [AUTH_CONFIG],
    },
    AuthGuard,
  ],
  exports: [AUTH_CONFIG, TokenService, AuthGuard],
})
export class AuthModule {}
