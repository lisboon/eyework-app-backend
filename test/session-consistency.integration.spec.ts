import { PrismaService } from '@/infra/database/prisma.service';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';
import type { RefreshToken } from '@/modules/users/domain/refresh-token.entity';
import { User } from '@/modules/users/domain/user.entity';
import { RefreshTokenRepository } from '@/modules/users/repository/refresh-token.repository';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { SessionService } from '@/modules/users/service/session.service';
import { LogoutUseCase } from '@/modules/users/usecase/logout/logout.usecase';
import { RefreshUseCase } from '@/modules/users/usecase/refresh/refresh.usecase';
import { SignUpUseCase } from '@/modules/users/usecase/signup/signup.usecase';
import { resetDatabase } from './setup/database';

describe('Session consistency (integration)', () => {
  let prisma: PrismaService;
  let tokens: RefreshTokenRepository;
  let users: UserRepository;
  let sessions: SessionService;
  let user: User;

  const authService = { generateToken: () => 'access-token' };
  const refreshWith = (sessionService: SessionService) =>
    new RefreshUseCase(tokens, users, sessionService);

  const pausedBeforeInsert = () => {
    let reachInsert!: () => void;
    let release!: () => void;
    const reached = new Promise<void>((resolve) => (reachInsert = resolve));
    const released = new Promise<void>((resolve) => (release = resolve));
    const gateway = {
      create: async (token: RefreshToken) => {
        reachInsert();
        await released;
        await tokens.create(token);
      },
    };
    return {
      sessions: new SessionService(gateway, authService, 3600),
      reached,
      release,
    };
  };

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    tokens = new RefreshTokenRepository(prisma);
    users = new UserRepository(prisma);
    sessions = new SessionService(tokens, authService, 3600);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    user = User.create({
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'hashed-password',
    });
    await users.create(user);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('a revocation while a refresh is storing the next token', () => {
    it('should let only one of two simultaneous refreshes win and leave its token unable to renew', async () => {
      const { refreshToken } = await sessions.start(user.id);

      const results = await Promise.allSettled([
        refreshWith(sessions).execute({ refreshToken }),
        refreshWith(sessions).execute({ refreshToken }),
      ]);

      const winners = results.filter((result) => result.status === 'fulfilled');
      expect(winners).toHaveLength(1);
      await expect(
        refreshWith(sessions).execute({
          refreshToken: winners[0].value.refreshToken,
        }),
      ).rejects.toThrow('Invalid refresh token');
    });
    it.each([
      [
        'logout',
        (token: string) =>
          new LogoutUseCase(tokens).execute({ refreshToken: token }),
      ],
      [
        'reuse of the same token',
        (token: string) =>
          expect(
            refreshWith(sessions).execute({ refreshToken: token }),
          ).rejects.toThrow('Invalid refresh token'),
      ],
    ])(
      'should leave the next token unable to renew after a %s',
      async (_, revoke: (token: string) => Promise<unknown>) => {
        const { refreshToken } = await sessions.start(user.id);
        const otherDevice = await sessions.start(user.id);
        const paused = pausedBeforeInsert();

        const rotation = refreshWith(paused.sessions).execute({ refreshToken });
        await paused.reached;
        await revoke(refreshToken);
        paused.release();
        const next = await rotation;

        await expect(
          refreshWith(sessions).execute({ refreshToken: next.refreshToken }),
        ).rejects.toThrow('Invalid refresh token');
        await expect(
          refreshWith(sessions).execute({
            refreshToken: otherDevice.refreshToken,
          }),
        ).resolves.toEqual(
          expect.objectContaining({ accessToken: 'access-token' }),
        );
      },
    );
  });

  describe('signup', () => {
    const input = {
      name: 'Bia Lima',
      email: 'bia@example.com',
      password: 'correct-horse-battery',
    };
    const hasher = { hashPassword: async () => 'hashed-password' };

    it('should not keep the account when the first session cannot be stored', async () => {
      const failingSessions = new SessionService(
        {
          create: async () => {
            throw new Error('session storage failed');
          },
        },
        authService,
        3600,
      );
      const signUp = new SignUpUseCase(
        new PrismaTransactionManager(prisma),
        users,
        hasher,
        failingSessions,
      );

      await expect(signUp.execute(input)).rejects.toThrow(
        'session storage failed',
      );
      await expect(users.findByEmail('bia@example.com')).resolves.toBe(null);
    });

    it('should store the account and its first session together', async () => {
      const signUp = new SignUpUseCase(
        new PrismaTransactionManager(prisma),
        users,
        hasher,
        sessions,
      );

      const output = await signUp.execute(input);

      await expect(
        prisma.refreshTokenFamily.count({ where: { userId: output.id } }),
      ).resolves.toBe(1);
      await expect(
        refreshWith(sessions).execute({ refreshToken: output.refreshToken }),
      ).resolves.toEqual(
        expect.objectContaining({ accessToken: 'access-token' }),
      );
    });
  });
});
