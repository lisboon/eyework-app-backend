import { type INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { EntityValidationErrorFilter } from './shared/errors/entity.validation.error';
import { exceptionFactory } from './shared/errors/exception-factory';

export function configureApp<T extends INestApplication>(app: T): T {
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ exceptionFactory, whitelist: true }));
  app.useGlobalFilters(new EntityValidationErrorFilter());

  return app;
}
