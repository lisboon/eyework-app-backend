import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '@/infra/database/prisma.service';
import { createTestApp, resetRateLimits } from './setup/app';
import { resetDatabase } from './setup/database';

describe('Workspaces (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const http = () => request(app.getHttpServer());

  const signUp = async (name: string, email: string) => {
    const { body } = await http()
      .post('/auth/signup')
      .send({ name, email, password: 'correct-horse-battery' })
      .expect(201);
    return body as { id: string; accessToken: string };
  };

  const createIndividual = (token: string) =>
    http()
      .post('/workspaces/individual')
      .set('Authorization', `Bearer ${token}`);

  const list = (token: string) =>
    http().get('/workspaces').set('Authorization', `Bearer ${token}`);

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

  it('should create the individual workspace of the account, named after it, with it as owner', async () => {
    const ana = await signUp('Ana Souza', 'ana@example.com');

    const response = await createIndividual(ana.accessToken);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      type: 'INDIVIDUAL',
      name: 'Ana Souza',
      role: 'OWNER',
    });
  });

  it('should answer 200 with the same workspace when it already exists', async () => {
    const ana = await signUp('Ana Souza', 'ana@example.com');
    const first = await createIndividual(ana.accessToken).expect(201);

    const second = await createIndividual(ana.accessToken);

    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
  });

  it('should create only one workspace when the button is clicked twice at once', async () => {
    const ana = await signUp('Ana Souza', 'ana@example.com');

    const responses = await Promise.all([
      createIndividual(ana.accessToken),
      createIndividual(ana.accessToken),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 201,
    ]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    await expect(prisma.workspace.count()).resolves.toBe(1);
  });

  it('should list only the workspaces of the account', async () => {
    const ana = await signUp('Ana Souza', 'ana@example.com');
    const bia = await signUp('Bia Lima', 'bia@example.com');
    const created = await createIndividual(ana.accessToken).expect(201);

    await list(ana.accessToken).expect(200, [created.body]);
    await list(bia.accessToken).expect(200, []);
  });

  it.each([
    [
      'POST /workspaces/individual',
      () => http().post('/workspaces/individual'),
    ],
    ['GET /workspaces', () => http().get('/workspaces')],
  ])('should answer 401 on %s without an access token', async (_, send) => {
    const response = await send();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Missing access token');
  });

  it('should answer 401 when the account was deactivated', async () => {
    const ana = await signUp('Ana Souza', 'ana@example.com');
    await prisma.user.update({
      where: { id: ana.id },
      data: { active: false },
    });

    await createIndividual(ana.accessToken).expect(401);
    await list(ana.accessToken).expect(401);
    await expect(prisma.workspace.count()).resolves.toBe(0);
  });
});
