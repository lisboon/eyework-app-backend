import { type INestApplication, Logger } from '@nestjs/common';
import request, { type Response } from 'supertest';
import { PrismaService } from '@/infra/database/prisma.service';
import { createTestApp, resetRateLimits } from './setup/app';
import { resetDatabase } from './setup/database';

describe('Rate limits (integration)', () => {
  const password = 'correct-horse-battery';
  const account = { name: 'Ana Souza', email: 'ana@example.com', password };

  const tooManyRequests = (response: Response) => {
    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests',
    });
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  };

  const repeat = async (
    times: number,
    send: (i: number) => Promise<Response>,
  ) => {
    const statuses: number[] = [];
    for (let i = 0; i < times; i++) {
      statuses.push((await send(i)).status);
    }
    return statuses;
  };

  describe('behind one trusted proxy', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    const from = (ip: string) => {
      const http = request(app.getHttpServer());
      return {
        post: (path: string) => http.post(path).set('X-Forwarded-For', ip),
        get: (path: string) => http.get(path).set('X-Forwarded-For', ip),
      };
    };
    const signUp = (ip: string, email: string) =>
      from(ip)
        .post('/auth/signup')
        .send({ ...account, email });
    const login = (ip: string, email: string) =>
      from(ip).post('/auth/login').send({ email, password: 'wrong-password' });

    beforeAll(async () => {
      process.env.TRUST_PROXY = '1';
      try {
        app = await createTestApp();
      } finally {
        delete process.env.TRUST_PROXY;
      }
      prisma = app.get(PrismaService);
    });

    beforeEach(async () => {
      await resetDatabase(prisma);
      resetRateLimits(app);
    });

    afterAll(async () => {
      await app.close();
    });

    it('should allow 5 signups a minute from one IP and refuse the 6th', async () => {
      const statuses = await repeat(5, (i) =>
        signUp('203.0.113.1', `user${i}@example.com`),
      );

      expect(statuses).toEqual([201, 201, 201, 201, 201]);
      tooManyRequests(await signUp('203.0.113.1', 'user5@example.com'));
      await signUp('203.0.113.2', 'user5@example.com').expect(201);
    });

    it('should allow 5 logins a minute from one IP and refuse the 6th', async () => {
      await signUp('198.51.100.1', account.email).expect(201);

      const statuses = await repeat(5, () =>
        login('203.0.113.1', account.email),
      );

      expect(statuses).toEqual([401, 401, 401, 401, 401]);
      tooManyRequests(await login('203.0.113.1', account.email));
      await login('203.0.113.2', account.email).expect(401);
    });

    it('should allow 10 logins per email every 15 minutes, whatever the IP and the case', async () => {
      await signUp('198.51.100.1', account.email).expect(201);

      const statuses = await repeat(10, (i) =>
        login(`203.0.113.${i + 1}`, i % 2 ? 'ANA@example.com' : account.email),
      );

      expect(statuses).toEqual(new Array(10).fill(401));
      tooManyRequests(await login('203.0.113.50', ' Ana@Example.COM '));
      await login('203.0.113.50', 'bia@example.com').expect(401);
    });

    it('should allow 20 refreshes a minute from one IP and refuse the 21st', async () => {
      const refresh = () =>
        from('203.0.113.1')
          .post('/auth/refresh')
          .set('Cookie', 'refresh_token=unknown');

      const statuses = await repeat(20, refresh);

      expect(statuses).toEqual(new Array(20).fill(401));
      tooManyRequests(await refresh());
    });

    it('should not limit logout and health checks', async () => {
      const logouts = await repeat(25, () =>
        from('203.0.113.1').post('/auth/logout'),
      );
      const checks = await repeat(25, () =>
        from('203.0.113.1').get('/health/live'),
      );

      expect(logouts).toEqual(new Array(25).fill(204));
      expect(checks).toEqual(new Array(25).fill(200));
    });

    it('should log the refused request without the email', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn');
      try {
        await repeat(5, () => login('203.0.113.1', account.email));
        await login('203.0.113.1', account.email).expect(429);

        expect(warn).toHaveBeenCalledWith(
          'Rate limit exceeded on POST /auth/login from 203.0.113.1',
        );
        expect(JSON.stringify(warn.mock.calls)).not.toContain(account.email);
      } finally {
        warn.mockRestore();
      }
    });
  });

  describe('without a trusted proxy', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('should ignore X-Forwarded-For, so a client cannot pick a new IP per request', async () => {
      const statuses = await repeat(6, (i) =>
        request(app.getHttpServer())
          .post('/auth/login')
          .set('X-Forwarded-For', `203.0.113.${i + 1}`)
          .send({ email: `user${i}@example.com`, password: 'wrong-password' }),
      );

      expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    });
  });
});
