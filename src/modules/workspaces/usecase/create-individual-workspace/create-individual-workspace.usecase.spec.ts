import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import { Workspace } from '../../domain/workspace.entity';
import { CreateIndividualWorkspaceUseCase } from './create-individual-workspace.usecase';

describe('CreateIndividualWorkspaceUseCase', () => {
  const owner = { id: 'user-1', name: 'Ana Souza', email: 'ana@example.com' };

  const makeSut = (stored?: Workspace) => {
    const workspaceGateway = {
      createIndividual: jest.fn(async (workspace: Workspace) =>
        stored
          ? { workspace: stored, created: false }
          : { workspace, created: true },
      ),
    };
    const userFacade = { findMe: jest.fn().mockResolvedValue(owner) };
    const useCase = new CreateIndividualWorkspaceUseCase(
      workspaceGateway,
      userFacade,
    );
    return { useCase, workspaceGateway, userFacade };
  };

  it('should create the individual workspace of the account, named after it, with it as owner', async () => {
    const { useCase, workspaceGateway, userFacade } = makeSut();

    const output = await useCase.execute({ userId: 'user-1' });

    expect(userFacade.findMe).toHaveBeenCalledWith({ id: 'user-1' });
    const created: Workspace =
      workspaceGateway.createIndividual.mock.calls[0][0];
    expect(created.individualOwnerId).toBe('user-1');
    expect(created.members).toEqual([{ userId: 'user-1', role: 'OWNER' }]);
    expect(output).toEqual({
      id: created.id,
      type: 'INDIVIDUAL',
      name: 'Ana Souza',
      role: 'OWNER',
      created: true,
    });
  });

  it('should answer with the workspace that already exists', async () => {
    const existing = Workspace.createIndividual({
      id: 'user-1',
      name: 'Ana S.',
    });
    const { useCase } = makeSut(existing);

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
      id: existing.id,
      type: 'INDIVIDUAL',
      name: 'Ana S.',
      role: 'OWNER',
      created: false,
    });
  });

  it('should not create anything for an account that cannot sign in', async () => {
    const { useCase, workspaceGateway, userFacade } = makeSut();
    userFacade.findMe.mockRejectedValue(new UnauthorizedError());

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(workspaceGateway.createIndividual).not.toHaveBeenCalled();
  });
});
