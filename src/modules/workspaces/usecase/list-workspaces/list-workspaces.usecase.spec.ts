import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import { ListWorkspacesUseCase } from './list-workspaces.usecase';

describe('ListWorkspacesUseCase', () => {
  const memberships = [
    { id: 'workspace-1', type: 'INDIVIDUAL', name: 'Ana Souza', role: 'OWNER' },
    { id: 'workspace-2', type: 'COMPANY', name: 'Eyework', role: 'RECRUITER' },
  ] as const;

  const makeSut = () => {
    const workspaceGateway = {
      findMembershipsOf: jest.fn().mockResolvedValue(memberships),
    };
    const userFacade = {
      findMe: jest.fn().mockResolvedValue({
        id: 'user-1',
        name: 'Ana Souza',
        email: 'ana@example.com',
      }),
    };
    const useCase = new ListWorkspacesUseCase(workspaceGateway, userFacade);
    return { useCase, workspaceGateway, userFacade };
  };

  it('should list the workspaces of the account with its role in each', async () => {
    const { useCase, workspaceGateway } = makeSut();

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual(
      memberships,
    );
    expect(workspaceGateway.findMembershipsOf).toHaveBeenCalledWith('user-1');
  });

  it('should not list anything for an account that cannot sign in', async () => {
    const { useCase, workspaceGateway, userFacade } = makeSut();
    userFacade.findMe.mockRejectedValue(new UnauthorizedError());

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(workspaceGateway.findMembershipsOf).not.toHaveBeenCalled();
  });
});
