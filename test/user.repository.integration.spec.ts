import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';
import { User } from '@/modules/users/domain/user.entity';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { PrismaService } from '@/infra/database/prisma.service';
import { resetDatabase } from './setup/database';

describe('UserRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: UserRepository;

  const makeUser = (email = 'ana@example.com') =>
    User.create({ name: 'Ana Souza', email, password: 'hashed-password' });

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new UserRepository(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should persist a user and find it by email', async () => {
    const user = makeUser();

    await repository.create(user);
    const found = await repository.findByEmail('ana@example.com');

    expect(found).toBeInstanceOf(User);
    expect(found?.id).toBe(user.id);
    expect(found?.name).toBe('Ana Souza');
    expect(found?.email).toBe('ana@example.com');
    expect(found?.password).toBe('hashed-password');
    expect(found?.active).toBe(true);
    expect(found?.createdAt).toEqual(user.createdAt);
    expect(found?.deletedAt).toBeUndefined();
  });

  it('should return null when the email is not registered', async () => {
    await expect(repository.findByEmail('nobody@example.com')).resolves.toBe(
      null,
    );
  });

  it('should translate the unique index violation from MySQL', async () => {
    await repository.create(makeUser());

    const error = await repository
      .create(makeUser('ana@example.com'))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { email: ['Email already registered'] },
    ]);
  });
});
