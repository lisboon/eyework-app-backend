import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { EntityValidationErrorFilter } from './shared/errors/entity.validation.error';
import { exceptionFactory } from './shared/errors/exception-factory';
import { UnauthorizedErrorFilter } from './shared/errors/unauthorized.error';

const LONE_SURROGATE = /\p{Surrogate}/u;

function rejectLoneSurrogates(key: string, value: unknown): unknown {
  if (
    LONE_SURROGATE.test(key) ||
    (typeof value === 'string' && LONE_SURROGATE.test(value))
  ) {
    throw new SyntaxError('Request body contains invalid Unicode');
  }
  return value;
}

export function configureApp<T extends NestExpressApplication>(app: T): T {
  app.use(helmet());
  app.useBodyParser('json', { reviver: rejectLoneSurrogates });
  app.useGlobalPipes(new ValidationPipe({ exceptionFactory, whitelist: true }));
  app.useGlobalFilters(
    new EntityValidationErrorFilter(),
    new UnauthorizedErrorFilter(),
  );

  return app;
}
