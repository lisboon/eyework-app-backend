import type { PrismaClient } from '@/infra/database/generated/prisma/client';
import type { UserFacade } from '@/modules/users/facade/user.facade';
import { WorkspaceFacade } from '../facade/workspace.facade';
import { WorkspaceRepository } from '../repository/workspace.repository';
import { CreateIndividualWorkspaceUseCase } from '../usecase/create-individual-workspace/create-individual-workspace.usecase';
import { ListWorkspacesUseCase } from '../usecase/list-workspaces/list-workspaces.usecase';

export class WorkspaceFacadeFactory {
  static create(
    prisma: PrismaClient,
    userFacade: Pick<UserFacade, 'findMe'>,
  ): WorkspaceFacade {
    const workspaceRepository = new WorkspaceRepository(prisma);

    return new WorkspaceFacade(
      new CreateIndividualWorkspaceUseCase(workspaceRepository, userFacade),
      new ListWorkspacesUseCase(workspaceRepository, userFacade),
    );
  }
}
