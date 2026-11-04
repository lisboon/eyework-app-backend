import type { INestApplication } from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import request from 'supertest';
import { PrismaService } from '@/infra/database/prisma.service';
import {
  SESSION_CLEANUP_JOB,
  SessionCleanupJob,
} from '@/infra/http/user/session-cleanup.job';
import { createTestApp } from './setup/app';
import { resetDatabase } from './setup/database';

describe('Session cleanup job (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const signUp = (email: string) =>
    request(app.getHttpServer())
      .post('/auth/signup')
      .send({ name: 'Ana Souza', email, password: 'correct-horse-battery' })
      .expect(201);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be scheduled every day at 3 AM', () => {
    const job = app.get(SchedulerRegistry).getCronJob(SESSION_CLEANUP_JOB);

    expect(job.cronTime.source).toBe(CronExpression.EVERY_DAY_AT_3AM);
  });

  it('should delete the expired sessions and keep the others when it runs', async () => {
    const expired = await signUp('ana@example.com');
    const live = await signUp('bia@example.com');
    await prisma.refreshToken.updateMany({
      where: { family: { userId: expired.body.id } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await app.get(SessionCleanupJob).deleteExpiredSessions();

    const families = await prisma.refreshTokenFamily.findMany();
    expect(families.map((family) => family.userId)).toEqual([live.body.id]);
  });
});
