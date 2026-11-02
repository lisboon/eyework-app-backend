import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  Logger.log(`Server is running on port ${port}`, 'Bootstrap');
}
void bootstrap();
