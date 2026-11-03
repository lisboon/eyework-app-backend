import { RefreshToken } from '@/modules/users/domain/refresh-token.entity';
import { User } from '@/modules/users/domain/user.entity';
import { RefreshTokenRepository } from '@/modules/users/repository/refresh-token.repository';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { PrismaService } from '@/infra/database/prisma.service';
import { resetDatabase } from './setup/database';

describe('RefreshTokenRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: RefreshTokenRepository;
  let user: User;

  const makeToken = (familyId?: string) =>
    new RefreshToken({
      userId: user.id,
      familyId,
      tokenHash: RefreshToken.hash(RefreshToken.generate()),
      expiresAt: new Date('2026-12-03T00:00:00.000Z'),
    });

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new RefreshTokenRepository(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    user = User.create({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'hashed-password',
    });
    await new UserRepository(prisma).create(user);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should persist a token and find it by its hash', async () => {
    const token = makeToken();

    await repository.create(token);
    const found = await repository.findByTokenHash(token.tokenHash);

    expect(found).toBeInstanceOf(RefreshToken);
    expect(found?.id).toBe(token.id);
    expect(found?.userId).toBe(user.id);
    expect(found?.familyId).toBe(token.familyId);
    expect(found?.expiresAt).toEqual(token.expiresAt);
    expect(found?.createdAt).toEqual(token.createdAt);
    expect(found?.isRevoked()).toBe(false);
  });

  it('should return null for an unknown hash', async () => {
    await expect(
      repository.findByTokenHash(RefreshToken.hash('unknown')),
    ).resolves.toBe(null);
  });

  it('should revoke a token only once', async () => {
    const token = makeToken();
    await repository.create(token);

    await expect(repository.revoke(token.id)).resolves.toBe(true);
    await expect(repository.revoke(token.id)).resolves.toBe(false);
    const found = await repository.findByTokenHash(token.tokenHash);
    expect(found?.isRevoked()).toBe(true);
  });

  it('should revoke every token of a family and nothing else', async () => {
    const first = makeToken();
    const second = makeToken(first.familyId);
    const otherFamily = makeToken();
    for (const token of [first, second, otherFamily]) {
      await repository.create(token);
    }

    await repository.revokeFamily(first.familyId);

    const revoked = await Promise.all(
      [first, second, otherFamily].map(async (token) =>
        (await repository.findByTokenHash(token.tokenHash))?.isRevoked(),
      ),
    );
    expect(revoked).toEqual([true, true, false]);
  });

  it('should delete the tokens together with the account', async () => {
    await repository.create(makeToken());

    await prisma.user.delete({ where: { id: user.id } });

    await expect(prisma.refreshToken.count()).resolves.toBe(0);
  });
});
