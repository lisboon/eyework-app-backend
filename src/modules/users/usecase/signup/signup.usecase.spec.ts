import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';
import {
  TransactionContext,
  type TransactionManager,
} from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { User } from '../../domain/user.entity';
import { SignUpUseCase } from './signup.usecase';

describe('SignUpUseCase', () => {
  const input = {
    name: 'Ana Souza',
    email: 'Ana@Example.com',
    password: 'correct-horse-battery',
  };
  const session = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    refreshTokenExpiresAt: new Date('2026-12-03T00:00:00.000Z'),
  };
  const trx = new (class extends TransactionContext {
    constructor() {
      super();
    }
  })();

  const makeSut = (existingUser: User | null = null) => {
    const transactionManager = {
      execute: jest.fn(
        async (work: (context: TransactionContext) => Promise<unknown>) =>
          work(trx),
      ),
    };
    const userGateway = {
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
    };
    const sessionService = {
      start: jest.fn().mockResolvedValue(session),
    };
    const useCase = new SignUpUseCase(
      transactionManager as unknown as TransactionManager,
      userGateway,
      passwordService,
      sessionService,
    );
    return {
      useCase,
      transactionManager,
      userGateway,
      passwordService,
      sessionService,
    };
  };

  it('should store the user and the first session in one transaction', async () => {
    const { useCase, transactionManager, userGateway, sessionService } =
      makeSut();

    const output = await useCase.execute(input);

    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    const created: User = userGateway.create.mock.calls[0][0];
    expect(userGateway.create).toHaveBeenCalledWith(created, trx);
    expect(sessionService.start).toHaveBeenCalledWith(created.id, trx);
    expect(userGateway.create.mock.invocationCallOrder[0]).toBeLessThan(
      sessionService.start.mock.invocationCallOrder[0],
    );
    expect(created).toBeInstanceOf(User);
    expect(created.password).toBe('hashed-password');
    expect(created.email).toBe('ana@example.com');
    expect(output).toEqual({
      id: created.id,
      name: 'Ana Souza',
      email: 'ana@example.com',
      ...session,
    });
  });

  it('should fail without a session when the transaction fails', async () => {
    const { useCase, transactionManager } = makeSut();
    const failure = new Error('session storage failed');
    transactionManager.execute.mockRejectedValueOnce(failure);

    await expect(useCase.execute(input)).rejects.toBe(failure);
  });

  it('should reject a registered email before spending time on the hash', async () => {
    const existing = new User({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'hash',
    });
    const { useCase, transactionManager, userGateway, passwordService } =
      makeSut(existing);

    const error = await useCase.execute(input).catch((e: unknown) => e);

    expect(userGateway.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { email: ['Email already registered'] },
    ]);
    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(transactionManager.execute).not.toHaveBeenCalled();
  });

  it('should reject invalid data without opening a transaction', async () => {
    const { useCase, transactionManager, userGateway } = makeSut();

    const error = await useCase
      .execute({ ...input, name: 'A', email: 'not-an-email' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { name: expect.any(Array) },
      { email: expect.any(Array) },
    ]);
    expect(transactionManager.execute).not.toHaveBeenCalled();
    expect(userGateway.create).not.toHaveBeenCalled();
  });
});
