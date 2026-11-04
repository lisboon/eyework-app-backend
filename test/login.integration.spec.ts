import type { INestApplication } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { PrismaService } from '@/infra/database/prisma.service';
import { createTestApp, resetRateLimits } from './setup/app';
import { resetDatabase } from './setup/database';

describe('Login and current user (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const account = {
    name: 'Ana Souza',
    email: 'ana@example.com',
    password: 'correct-horse-battery',
  };

  const http = () => request(app.getHttpServer());
  const signUp = () => http().post('/auth/signup').send(account).expect(201);
  const login = (body: object) => http().post('/auth/login').send(body);
  const me = (token?: string) =>
    token
      ? http().get('/users/me').set('Authorization', `Bearer ${token}`)
      : http().get('/users/me');

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

  it('should accept the token returned by the signup on /users/me', async () => {
    const { body } = await signUp();

    const response = await me(body.accessToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: body.id,
      name: 'Ana Souza',
      email: 'ana@example.com',
    });
  });

  it('should log in with the email in any case and return a working token', async () => {
    await signUp();

    const response = await login({
      email: 'ANA@example.com',
      password: account.password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: expect.any(String) });
    await me(response.body.accessToken).expect(200);
  });

  it.each([
    ['a wrong password', { email: account.email, password: 'wrong-password' }],
    [
      'an unknown email',
      { email: 'nobody@example.com', password: account.password },
    ],
  ])('should answer 401 with a generic message for %s', async (_, body) => {
    await signUp();

    const response = await login(body);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
  });

  it('should refuse the login of an inactive account', async () => {
    await signUp();
    await prisma.user.update({
      where: { email: account.email },
      data: { active: false },
    });

    const response = await login({
      email: account.email,
      password: account.password,
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('should validate the login body', async () => {
    const response = await login({ email: 'not-an-email' });

    expect(response.status).toBe(422);
    expect(response.body.message).toEqual([
      { email: expect.any(Array) },
      { password: expect.any(Array) },
    ]);
  });

  it('should reject a login password longer than 72 bytes', async () => {
    await signUp();

    const response = await login({
      email: account.email,
      password: `${account.password}${'a'.repeat(60)}`,
    });

    expect(response.status).toBe(422);
    expect(response.body.message).toEqual([
      { password: ['password must be at most 72 bytes'] },
    ]);
  });

  it('should answer 401 on /users/me without a token', async () => {
    const response = await me();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing access token',
    });
  });

  it('should answer 401 on /users/me with an expired token', async () => {
    const { body } = await signUp();
    const expired = sign(
      { sub: body.id, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET as string,
    );

    const response = await me(expired);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid access token');
  });

  it('should answer 401 on /users/me when the account was deactivated', async () => {
    const { body } = await signUp();
    await prisma.user.update({
      where: { id: body.id },
      data: { active: false },
    });

    const response = await me(body.accessToken);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    });
  });
});
