import { type NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { corsOriginsFromEnv } from './cors.config';
import { EntityValidationErrorFilter } from './shared/errors/entity.validation.error';
import { exceptionFactory } from './shared/errors/exception-factory';
import { UnauthorizedErrorFilter } from './shared/errors/unauthorized.error';
import { rejectForeignOrigins } from './shared/reject-foreign-origins';
import { rejectUnsafeJson } from './shared/reject-unsafe-json';

export const APP_OPTIONS: NestApplicationOptions = { bodyParser: false };

export function configureApp<T extends NestExpressApplication>(app: T): T {
  const origins = corsOriginsFromEnv(process.env);

  app.use(helmet());
  app.enableCors({ origin: origins, credentials: true });
  app.use(rejectForeignOrigins(origins));
  app.use(cookieParser());
  app.useBodyParser('json');
  app.use(rejectUnsafeJson);
  app.useGlobalPipes(new ValidationPipe({ exceptionFactory, whitelist: true }));
  app.useGlobalFilters(
    new EntityValidationErrorFilter(),
    new UnauthorizedErrorFilter(),
  );

  return app;
}
