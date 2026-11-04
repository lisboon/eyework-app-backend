import { createHash } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
import { PrismaService } from '@/infra/database/prisma.service';
import { createTestApp, resetRateLimits } from './setup/app';
import { resetDatabase } from './setup/database';

describe('Refresh token and logout (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const account = {
    name: 'Ana Souza',
    email: 'ana@example.com',
    password: 'correct-horse-battery',
  };

  const http = () => request(app.getHttpServer());

  const refreshCookieOf = (response: Response): string => {
    const cookies = response.get('Set-Cookie') ?? [];
    return cookies.find((cookie) => cookie.startsWith('refresh_token=')) ?? '';
  };
  const tokenOf = (response: Response): string =>
    refreshCookieOf(response).split(';')[0].slice('refresh_token='.length);

  const signUp = async () =>
    tokenOf(await http().post('/auth/signup').send(account).expect(201));
  const withCookie = (path: string, token: string) =>
    http().post(path).set('Cookie', `refresh_token=${token}`);
  const refresh = (token: string) => withCookie('/auth/refresh', token);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    resetRateLimits(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should keep the refresh token in an http-only cookie and out of the body on login', async () => {
    await signUp();

    const response = await http()
      .post('/auth/login')
      .send({ email: account.email, password: account.password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: expect.any(String) });
    const cookie = refreshCookieOf(response);
    expect(cookie).toMatch(/^refresh_token=[A-Za-z0-9_-]{43}; /);
    expect(cookie).toContain('; Path=/auth');
    expect(cookie).toContain('; HttpOnly');
    expect(cookie).toContain('; Secure');
    expect(cookie).toContain('; SameSite=Lax');
    const expires = Date.parse(/Expires=([^;]+)/.exec(cookie)?.[1] ?? '');
    expect(expires - Date.now()).toBeGreaterThan(29 * 24 * 3600 * 1000);
  });

  it('should store only the SHA-256 hash of the refresh token', async () => {
    const token = await signUp();

    const rows = await prisma.refreshToken.findMany();

    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
  });

  it('should rotate the refresh token and return a working access token', async () => {
    const first = await signUp();

    const response = await refresh(first);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: expect.any(String) });
    const second = tokenOf(response);
    expect(second).not.toBe(first);
    await http()
      .get('/users/me')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .expect(200);
    await refresh(second).expect(200);
  });

  it('should keep the deadline set at login when it rotates the refresh token', async () => {
    const signup = await http().post('/auth/signup').send(account).expect(201);
    const deadline = /Expires=([^;]+)/.exec(refreshCookieOf(signup))?.[1];

    const rotated = await refresh(tokenOf(signup)).expect(200);

    expect(/Expires=([^;]+)/.exec(refreshCookieOf(rotated))?.[1]).toBe(
      deadline,
    );
    const rows = await prisma.refreshToken.findMany();
    expect(rows).toHaveLength(2);
    expect(rows[1].expiresAt).toEqual(rows[0].expiresAt);
  });

  it('should revoke the whole family when a rotated token is used again', async () => {
    const first = await signUp();
    const second = tokenOf(await refresh(first).expect(200));

    const reuse = await refresh(first);

    expect(reuse.status).toBe(401);
    expect(reuse.body).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    });
    await refresh(second).expect(401);
  });

  it('should keep the other sessions of the account when one family is revoked', async () => {
    const first = await signUp();
    const otherDevice = tokenOf(
      await http()
        .post('/auth/login')
        .send({ email: account.email, password: account.password })
        .expect(200),
    );
    await refresh(first).expect(200);

    await refresh(first).expect(401);

    await refresh(otherDevice).expect(200);
  });

  it('should answer 401 without the refresh token cookie', async () => {
    const response = await http().post('/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing refresh token',
    });
  });

  it('should answer 401 for an unknown refresh token', async () => {
    const response = await refresh('unknown-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid refresh token');
  });

  it('should answer 401 for an expired refresh token', async () => {
    const token = await signUp();
    await prisma.refreshToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await refresh(token).expect(401);
  });

  it('should answer 401 when the account was deactivated', async () => {
    const token = await signUp();
    await prisma.user.update({
      where: { email: account.email },
      data: { active: false },
    });

    await refresh(token).expect(401);
  });

  it('should revoke the session and clear the cookie on logout', async () => {
    const token = await signUp();

    const response = await withCookie('/auth/logout', token);

    expect(response.status).toBe(204);
    const cookie = refreshCookieOf(response);
    expect(cookie).toMatch(/^refresh_token=; /);
    expect(cookie).toContain('; Path=/auth');
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    await refresh(token).expect(401);
  });

  it('should answer 204 on logout without a cookie', async () => {
    await http().post('/auth/logout').expect(204);
  });

  describe('Origin check', () => {
    const credentials = { email: account.email, password: account.password };

    it('should let the configured origin log in', async () => {
      await signUp();

      const response = await http()
        .post('/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(refreshCookieOf(response)).not.toBe('');
    });

    it('should refuse a login from another site without setting a cookie', async () => {
      await signUp();

      const response = await http()
        .post('/auth/login')
        .set('Origin', 'https://evil.example')
        .send(credentials);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Origin not allowed',
      });
      expect(refreshCookieOf(response)).toBe('');
    });

    it('should refuse a logout from a sibling subdomain and keep the session', async () => {
      const token = await signUp();

      await withCookie('/auth/logout', token)
        .set('Origin', 'http://evil.localhost:3000')
        .expect(403);

      await refresh(token).expect(200);
    });

    it('should ignore a form-encoded login body', async () => {
      await signUp();

      const response = await http()
        .post('/auth/login')
        .type('form')
        .send(credentials);

      expect(response.status).toBe(422);
      expect(refreshCookieOf(response)).toBe('');
    });
  });

  describe('CORS', () => {
    const preflight = (origin: string) =>
      http()
        .options('/auth/refresh')
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST');

    it('should let the configured origin send credentials', async () => {
      const response = await preflight('http://localhost:3000');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should not allow any other origin', async () => {
      const response = await preflight('https://evil.example');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
