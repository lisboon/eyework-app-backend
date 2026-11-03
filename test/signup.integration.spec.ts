import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { version } from 'uuid';
import { PrismaService } from '@/infra/database/prisma.service';
import { AppModule } from '@/infra/http/app.module';
import { configureApp } from '@/infra/http/app.setup';
import { resetDatabase } from './setup/database';

describe('POST /auth/signup (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const validBody = {
    name: 'Ana Souza',
    email: 'ana@example.com',
    password: 'correct-horse-battery',
  };

  const signUp = (body: object) =>
    request(app.getHttpServer()).post('/auth/signup').send(body);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create the account and return it without the password', async () => {
    const response = await signUp(validBody);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Ana Souza',
      email: 'ana@example.com',
    });
    expect(version(response.body.id)).toBe(7);

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: response.body.id },
    });
    expect(row.password).not.toBe(validBody.password);
    await expect(
      bcrypt.compare(validBody.password, row.password),
    ).resolves.toBe(true);
  });

  it('should return 422 with the messages of each invalid field', async () => {
    const response = await signUp({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(422);
    expect(response.body.statusCode).toBe(422);
    expect(response.body.error).toBe('Unprocessable Entity');
    expect(response.body.message).toEqual([
      { name: expect.any(Array) },
      { email: expect.any(Array) },
      { password: expect.any(Array) },
    ]);
  });

  it('should reject a password longer than 72 bytes', async () => {
    const response = await signUp({
      ...validBody,
      password: 'é'.repeat(37),
    });

    expect(response.status).toBe(422);
    expect(response.body.message).toEqual([
      { password: ['password must be at most 72 bytes'] },
    ]);
  });

  it('should return 422 when the email is already registered with another case', async () => {
    await signUp(validBody).expect(201);

    const response = await signUp({ ...validBody, email: 'Ana@Example.COM' });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: [{ email: ['Email already registered'] }],
    });
  });

  it('should ignore fields that are not part of the signup', async () => {
    const response = await signUp({
      ...validBody,
      id: 'chosen-id',
      active: false,
    });

    expect(response.status).toBe(201);
    expect(response.body.id).not.toBe('chosen-id');

    const row = await prisma.user.findUniqueOrThrow({
      where: { email: 'ana@example.com' },
    });
    expect(row.id).toBe(response.body.id);
    expect(row.active).toBe(true);
  });
});
