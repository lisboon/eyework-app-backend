import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function configureApp<T extends INestApplication>(app: T): T {
  app.use(helmet());

  return app;
}
