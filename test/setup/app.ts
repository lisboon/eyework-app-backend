import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/infra/http/app.module';
import { configureApp } from '@/infra/http/app.setup';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = configureApp(
    moduleRef.createNestApplication<NestExpressApplication>(),
  );
  await app.init();
  return app;
}
