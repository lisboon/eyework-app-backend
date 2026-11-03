import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';
import { User } from '../../domain/user.entity';
import { SignUpUseCase } from './signup.usecase';

describe('SignUpUseCase', () => {
  const input = {
    name: 'Ana Souza',
    email: 'Ana@Example.com',
    password: 'correct-horse-battery',
  };

  const makeSut = (existingUser: User | null = null) => {
    const userGateway = {
      findByEmail: jest.fn().mockResolvedValue(existingUser),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const authService = {
      hashPassword: jest.fn().mockResolvedValue('hashed-password'),
    };
    const useCase = new SignUpUseCase(userGateway, authService);
    return { useCase, userGateway, authService };
  };

  it('should store the hashed password and return the user without it', async () => {
    const { useCase, userGateway, authService } = makeSut();

    const output = await useCase.execute(input);

    expect(authService.hashPassword).toHaveBeenCalledWith(
      'correct-horse-battery',
    );
    expect(userGateway.findByEmail).toHaveBeenCalledWith('ana@example.com');
    expect(userGateway.create).toHaveBeenCalledTimes(1);
    const created: User = userGateway.create.mock.calls[0][0];
    expect(created).toBeInstanceOf(User);
    expect(created.password).toBe('hashed-password');
    expect(created.email).toBe('ana@example.com');
    expect(output).toEqual({
      id: created.id,
      name: 'Ana Souza',
      email: 'ana@example.com',
    });
  });

  it('should reject an email that is already registered', async () => {
    const existing = new User({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'hash',
    });
    const { useCase, userGateway } = makeSut(existing);

    const error = await useCase.execute(input).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { email: ['Email already registered'] },
    ]);
    expect(userGateway.create).not.toHaveBeenCalled();
  });

  it('should reject invalid data without touching the gateway', async () => {
    const { useCase, userGateway } = makeSut();

    const error = await useCase
      .execute({ ...input, name: 'A', email: 'not-an-email' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(EntityValidationError);
    expect((error as EntityValidationError).error).toEqual([
      { name: expect.any(Array) },
      { email: expect.any(Array) },
    ]);
    expect(userGateway.findByEmail).not.toHaveBeenCalled();
    expect(userGateway.create).not.toHaveBeenCalled();
  });
});
