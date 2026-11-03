import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';
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

  const makeSut = (existingUser: User | null = null) => {
    const userGateway = {
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const authService = {
      hashPassword: jest.fn().mockResolvedValue('hashed-password'),
    };
    const sessionService = {
      issue: jest.fn().mockResolvedValue(session),
    };
    const useCase = new SignUpUseCase(userGateway, authService, sessionService);
    return { useCase, userGateway, authService, sessionService };
  };

  it('should store the hashed password and start a session for the new user', async () => {
    const { useCase, userGateway, authService, sessionService } = makeSut();

    const output = await useCase.execute(input);

    expect(userGateway.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(authService.hashPassword).toHaveBeenCalledWith(
      'correct-horse-battery',
    );
    expect(userGateway.create).toHaveBeenCalledTimes(1);
    const created: User = userGateway.create.mock.calls[0][0];
    expect(created).toBeInstanceOf(User);
    expect(created.password).toBe('hashed-password');
    expect(created.email).toBe('ana@example.com');
    expect(sessionService.issue).toHaveBeenCalledWith(created.id);
    expect(userGateway.create.mock.invocationCallOrder[0]).toBeLessThan(
      sessionService.issue.mock.invocationCallOrder[0],
    );
    expect(output).toEqual({
      id: created.id,
      name: 'Ana Souza',
      email: 'ana@example.com',
      ...session,
    });
  });

  it('should reject a registered email before spending time on the hash', async () => {
    const existing = new User({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'hash',
    });
    const { useCase, userGateway, authService } = makeSut(existing);

    const error = await useCase.execute(input).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { email: ['Email already registered'] },
    ]);
    expect(authService.hashPassword).not.toHaveBeenCalled();
    expect(userGateway.create).not.toHaveBeenCalled();
  });

  it('should reject invalid data without creating the user', async () => {
    const { useCase, userGateway, sessionService } = makeSut();

    const error = await useCase
      .execute({ ...input, name: 'A', email: 'not-an-email' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { name: expect.any(Array) },
      { email: expect.any(Array) },
    ]);
    expect(userGateway.create).not.toHaveBeenCalled();
    expect(sessionService.issue).not.toHaveBeenCalled();
  });
});
