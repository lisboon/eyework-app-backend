import { PrismaService } from '@/infra/database/prisma.service';
import { PrismaTransactionManager } from '@/infra/database/prisma-transaction.manager';
import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
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
  let transactions: PrismaTransactionManager;
  let tokens: RefreshTokenRepository;
  let users: UserRepository;
  let sessions: SessionService;
  let user: User;

  const authService = { generateToken: () => 'access-token' };
  const refreshWith = (sessionService: SessionService) =>
    new RefreshUseCase(transactions, tokens, users, sessionService);
  const refresh = (refreshToken: string) =>
    refreshWith(sessions).execute({ refreshToken });

  const pausedBeforeInsert = () => {
    let reachInsert!: () => void;
    let release!: () => void;
    const reached = new Promise<void>((resolve) => (reachInsert = resolve));
    const released = new Promise<void>((resolve) => (release = resolve));
    const gateway = {
      create: async (token: RefreshToken, trx?: TransactionContext) => {
        reachInsert();
        await released;
        await tokens.create(token, trx);
      },
    };
    return {
      sessions: new SessionService(gateway, authService, 3600),
      reached,
      release,
    };
  };

  const failingSessions = new SessionService(
    {
      create: async () => {
        throw new Error('session storage failed');
      },
    },
    authService,
    3600,
  );

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    transactions = new PrismaTransactionManager(prisma);
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

  describe('refresh token rotation', () => {
    it('should let only one of two simultaneous refreshes win and leave its token unable to renew', async () => {
      const { refreshToken } = await sessions.start(user.id);

      const results = await Promise.allSettled([
        refresh(refreshToken),
        refresh(refreshToken),
      ]);

      const winners = results.filter((result) => result.status === 'fulfilled');
      expect(winners).toHaveLength(1);
      await expect(refresh(winners[0].value.refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should leave the next token unable to renew when a logout runs while it is stored', async () => {
      const { refreshToken } = await sessions.start(user.id);
      const otherDevice = await sessions.start(user.id);
      const paused = pausedBeforeInsert();

      const rotation = refreshWith(paused.sessions).execute({ refreshToken });
      await paused.reached;
      await new LogoutUseCase(tokens).execute({ refreshToken });
      paused.release();
      const next = await rotation;

      await expect(refresh(next.refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
      await expect(refresh(otherDevice.refreshToken)).resolves.toEqual(
        expect.objectContaining({ accessToken: 'access-token' }),
      );
    });

    it('should make a reuse that arrives during the rotation wait for it and revoke the family', async () => {
      const { refreshToken } = await sessions.start(user.id);
      const paused = pausedBeforeInsert();

      const rotation = refreshWith(paused.sessions).execute({ refreshToken });
      await paused.reached;
      const reuse = refresh(refreshToken);
      paused.release();
      const next = await rotation;

      await expect(reuse).rejects.toThrow('Invalid refresh token');
      await expect(refresh(next.refreshToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should keep the token usable when the next one cannot be stored', async () => {
      const { refreshToken } = await sessions.start(user.id);

      await expect(
        refreshWith(failingSessions).execute({ refreshToken }),
      ).rejects.toThrow('session storage failed');

      await expect(refresh(refreshToken)).resolves.toEqual(
        expect.objectContaining({ accessToken: 'access-token' }),
      );
    });
  });

  describe('signup', () => {
    const input = {
      name: 'Bia Lima',
      email: 'bia@example.com',
      password: 'correct-horse-battery',
    };
    const hasher = { hashPassword: async () => 'hashed-password' };

    it('should not keep the account when the first session cannot be stored', async () => {
      const signUp = new SignUpUseCase(
        transactions,
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
      const signUp = new SignUpUseCase(transactions, users, hasher, sessions);

      const output = await signUp.execute(input);

      await expect(
        prisma.refreshTokenFamily.count({ where: { userId: output.id } }),
      ).resolves.toBe(1);
      await expect(refresh(output.refreshToken)).resolves.toEqual(
        expect.objectContaining({ accessToken: 'access-token' }),
      );
    });
  });
});
