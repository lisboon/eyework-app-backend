import { PrismaService } from '@/infra/database/prisma.service';
import { User } from '@/modules/users/domain/user.entity';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { Workspace } from '@/modules/workspaces/domain/workspace.entity';
import { WorkspaceRepository } from '@/modules/workspaces/repository/workspace.repository';
import { resetDatabase } from './setup/database';

describe('WorkspaceRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: WorkspaceRepository;
  let ana: User;
  let bia: User;

  const makeUser = async (name: string, email: string) => {
    const user = User.create({ name, email, password: 'hashed-password' });
    await new UserRepository(prisma).create(user);
    return user;
  };

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repository = new WorkspaceRepository(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ana = await makeUser('Ana Souza', 'ana@example.com');
    bia = await makeUser('Bia Lima', 'bia@example.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should store an individual workspace with its owner as a member', async () => {
    const workspace = Workspace.createIndividual(ana);

    await expect(repository.createIndividual(workspace)).resolves.toEqual({
      workspace,
      created: true,
    });

    const row = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
      include: { members: true },
    });
    expect(row).toMatchObject({
      type: 'INDIVIDUAL',
      name: 'Ana Souza',
      individualOwnerId: ana.id,
      active: true,
      deletedAt: null,
    });
    expect(row.members).toEqual([
      expect.objectContaining({ userId: ana.id, role: 'OWNER' }),
    ]);
  });

  it('should answer with the stored workspace when the owner already has one', async () => {
    const first = Workspace.createIndividual(ana);
    await repository.createIndividual(first);

    const second = await repository.createIndividual(
      Workspace.createIndividual(ana),
    );

    expect(second.created).toBe(false);
    expect(second.workspace.id).toBe(first.id);
    expect(second.workspace.members).toEqual([
      { userId: ana.id, role: 'OWNER' },
    ]);
    await expect(prisma.workspace.count()).resolves.toBe(1);
  });

  it('should keep one individual workspace per owner when two are stored at once', async () => {
    const results = await Promise.all([
      repository.createIndividual(Workspace.createIndividual(ana)),
      repository.createIndividual(Workspace.createIndividual(ana)),
    ]);

    expect(results.map((result) => result.created).sort()).toEqual([
      false,
      true,
    ]);
    expect(results[0].workspace.id).toBe(results[1].workspace.id);
    await expect(prisma.workspace.count()).resolves.toBe(1);
  });

  it('should list the active workspaces of a member with the member role', async () => {
    const individual = Workspace.createIndividual(ana);
    await repository.createIndividual(individual);
    const joinedLater = new Date(individual.createdAt.getTime() + 1000);
    await prisma.workspace.create({
      data: {
        type: 'COMPANY',
        name: 'Eyework',
        members: {
          create: [
            { userId: bia.id, role: 'OWNER' },
            { userId: ana.id, role: 'RECRUITER', createdAt: joinedLater },
          ],
        },
      },
    });
    await prisma.workspace.create({
      data: {
        type: 'COMPANY',
        name: 'Closed',
        active: false,
        members: { create: [{ userId: ana.id, role: 'ADMIN' }] },
      },
    });
    await prisma.workspace.create({
      data: {
        type: 'COMPANY',
        name: 'Deleted',
        deletedAt: new Date(),
        members: { create: [{ userId: ana.id, role: 'ADMIN' }] },
      },
    });

    const memberships = await repository.findMembershipsOf(ana.id);

    expect(memberships).toEqual([
      {
        id: individual.id,
        type: 'INDIVIDUAL',
        name: 'Ana Souza',
        role: 'OWNER',
      },
      expect.objectContaining({
        type: 'COMPANY',
        name: 'Eyework',
        role: 'RECRUITER',
      }),
    ]);
    await expect(repository.findMembershipsOf(bia.id)).resolves.toEqual([
      expect.objectContaining({ name: 'Eyework', role: 'OWNER' }),
    ]);
  });

  it('should store nothing when the owner membership cannot be stored', async () => {
    const broken = new Workspace({
      type: 'INDIVIDUAL',
      name: 'Ana Souza',
      individualOwnerId: ana.id,
      members: [{ userId: 'missing-user', role: 'OWNER' }],
    });

    await expect(repository.createIndividual(broken)).rejects.toThrow();

    await expect(prisma.workspace.count()).resolves.toBe(0);
    await expect(prisma.workspaceMember.count()).resolves.toBe(0);
  });

  it('should delete the individual workspace and the memberships together with the account', async () => {
    await repository.createIndividual(Workspace.createIndividual(ana));

    await prisma.user.delete({ where: { id: ana.id } });

    await expect(prisma.workspace.count()).resolves.toBe(0);
    await expect(prisma.workspaceMember.count()).resolves.toBe(0);
  });
});
