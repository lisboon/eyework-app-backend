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

  const reload = (token: RefreshToken) =>
    repository.findByTokenHash(token.tokenHash);

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

  it('should persist a token with its new family and find it by its hash', async () => {
    const token = makeToken();

    await repository.create(token);
    const found = await reload(token);

    expect(found).toBeInstanceOf(RefreshToken);
    expect(found?.id).toBe(token.id);
    expect(found?.userId).toBe(user.id);
    expect(found?.familyId).toBe(token.familyId);
    expect(found?.expiresAt).toEqual(token.expiresAt);
    expect(found?.createdAt).toEqual(token.createdAt);
    expect(found?.isRevoked()).toBe(false);
    expect(found?.isFamilyRevoked()).toBe(false);
    await expect(prisma.refreshTokenFamily.count()).resolves.toBe(1);
  });

  it('should add the next token to the existing family', async () => {
    const first = makeToken();
    await repository.create(first);

    await repository.create(makeToken(first.familyId));

    await expect(prisma.refreshTokenFamily.count()).resolves.toBe(1);
    await expect(
      prisma.refreshToken.count({ where: { familyId: first.familyId } }),
    ).resolves.toBe(2);
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
    expect((await reload(token))?.isRevoked()).toBe(true);
  });

  it('should revoke the family of a token and leave the other families alone', async () => {
    const first = makeToken();
    const otherFamily = makeToken();
    await repository.create(first);
    await repository.create(otherFamily);

    await repository.revokeFamily(first.familyId);

    expect((await reload(first))?.isFamilyRevoked()).toBe(true);
    expect((await reload(otherFamily))?.isFamilyRevoked()).toBe(false);
  });

  it('should keep a family revoked for a token stored after the revocation', async () => {
    const first = makeToken();
    await repository.create(first);
    await repository.revokeFamily(first.familyId);

    const late = makeToken(first.familyId);
    await repository.create(late);

    expect((await reload(late))?.isFamilyRevoked()).toBe(true);
  });

  it('should delete only the families whose tokens all expired, with their tokens', async () => {
    const now = new Date('2026-12-03T03:00:00.000Z');
    const tokenOf = (expiresAt: Date, familyId?: string) =>
      new RefreshToken({
        userId: user.id,
        familyId,
        tokenHash: RefreshToken.hash(RefreshToken.generate()),
        expiresAt,
      });
    const past = new Date(now.getTime() - 1000);
    const future = new Date(now.getTime() + 1000);
    const expired = tokenOf(past);
    const expiredNext = tokenOf(past, expired.familyId);
    const live = tokenOf(future);
    const revokedLive = tokenOf(future);
    for (const token of [expired, expiredNext, live, revokedLive]) {
      await repository.create(token);
    }
    await repository.revokeFamily(revokedLive.familyId);

    await expect(repository.deleteExpiredFamilies(now)).resolves.toBe(1);

    const families = await prisma.refreshTokenFamily.findMany({
      orderBy: { id: 'asc' },
    });
    expect(families.map((family) => family.id)).toEqual(
      [live.familyId, revokedLive.familyId].sort(),
    );
    await expect(
      prisma.refreshToken.count({ where: { familyId: expired.familyId } }),
    ).resolves.toBe(0);
  });

  it('should delete the families and tokens together with the account', async () => {
    await repository.create(makeToken());

    await prisma.user.delete({ where: { id: user.id } });

    await expect(prisma.refreshTokenFamily.count()).resolves.toBe(0);
    await expect(prisma.refreshToken.count()).resolves.toBe(0);
  });
});
