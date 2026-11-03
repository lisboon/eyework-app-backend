import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import { User, type UserProps } from '../../domain/user.entity';
import { FindMeUseCase } from './find-me.usecase';

describe('FindMeUseCase', () => {
  const makeUser = (overrides: Partial<UserProps> = {}) =>
    new User({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@example.com',
      password: 'stored-hash',
      ...overrides,
    });

  const makeSut = (user: User | null) => {
    const userGateway = {
      findById: jest.fn().mockResolvedValue(user),
    };
    return { useCase: new FindMeUseCase(userGateway), userGateway };
  };

  it('should return the authenticated user without the password', async () => {
    const { useCase, userGateway } = makeSut(makeUser());

    await expect(useCase.execute({ id: 'user-1' })).resolves.toEqual({
      id: 'user-1',
      name: 'Ana Souza',
      email: 'ana@example.com',
    });
    expect(userGateway.findById).toHaveBeenCalledWith('user-1');
  });

  it.each([
    ['does not exist', null],
    ['is inactive', makeUser({ active: false })],
    ['was deleted', makeUser({ deletedAt: new Date() })],
  ])('should reject when the user %s', async (_, user) => {
    const { useCase } = makeSut(user);

    await expect(useCase.execute({ id: 'user-1' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
