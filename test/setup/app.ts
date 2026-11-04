import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '@/infra/http/app.module';
import { APP_OPTIONS, configureApp } from '@/infra/http/app.setup';

export async function createTestApp(
  customize: (builder: TestingModuleBuilder) => TestingModuleBuilder = (
    builder,
  ) => builder,
): Promise<INestApplication> {
  const moduleRef = await customize(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();

  const app = configureApp(
    moduleRef.createNestApplication<NestExpressApplication>(APP_OPTIONS),
  );
  await app.init();
  return app;
}
