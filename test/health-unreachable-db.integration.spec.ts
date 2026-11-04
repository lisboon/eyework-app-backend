import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/infra/database/prisma.service';
import { createTestApp } from './setup/app';

describe('Health with an unreachable database (integration)', () => {
  let app: INestApplication;

  const unreachablePrisma = () => {
    const url = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      'mysql://root:unused@127.0.0.1:1/eyework_test?acquireTimeout=300';
    try {
      return new PrismaService();
    } finally {
      process.env.DATABASE_URL = url;
    }
  };

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(PrismaService).useValue(unreachablePrisma()),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/ready should answer 503 when MySQL cannot be reached', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: 'unavailable' });
  });

  it('GET /health/live should still answer 200', async () => {
    const response = await request(app.getHttpServer()).get('/health/live');

    expect(response.status).toBe(200);
  });
});
