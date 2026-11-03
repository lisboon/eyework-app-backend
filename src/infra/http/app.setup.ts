import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { EntityValidationErrorFilter } from './shared/errors/entity.validation.error';
import { exceptionFactory } from './shared/errors/exception-factory';
import { UnauthorizedErrorFilter } from './shared/errors/unauthorized.error';
import { rejectUnsafeJson } from './shared/reject-unsafe-json';

export function configureApp<T extends NestExpressApplication>(app: T): T {
  app.use(helmet());
  app.useBodyParser('json');
  app.use(rejectUnsafeJson);
  app.useGlobalPipes(new ValidationPipe({ exceptionFactory, whitelist: true }));
  app.useGlobalFilters(
    new EntityValidationErrorFilter(),
    new UnauthorizedErrorFilter(),
  );

  return app;
}
