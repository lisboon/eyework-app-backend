import { Injectable } from '@nestjs/common';
import { WorkspaceFacade } from '@/modules/workspaces/facade/workspace.facade';
import type {
  CreateIndividualWorkspaceInputDto,
  CreateIndividualWorkspaceOutputDto,
} from '@/modules/workspaces/usecase/create-individual-workspace/create-individual-workspace.usecase.dto';
import type {
  ListWorkspacesInputDto,
  ListWorkspacesOutputDto,
} from '@/modules/workspaces/usecase/list-workspaces/list-workspaces.usecase.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly workspaceFacade: WorkspaceFacade) {}

  createIndividual(
    input: CreateIndividualWorkspaceInputDto,
  ): Promise<CreateIndividualWorkspaceOutputDto> {
    return this.workspaceFacade.createIndividual(input);
  }

  list(input: ListWorkspacesInputDto): Promise<ListWorkspacesOutputDto> {
    return this.workspaceFacade.list(input);
  }
}
