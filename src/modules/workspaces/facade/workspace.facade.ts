import type {
  CreateIndividualWorkspaceInputDto,
  CreateIndividualWorkspaceOutputDto,
  CreateIndividualWorkspaceUseCaseInterface,
} from '../usecase/create-individual-workspace/create-individual-workspace.usecase.dto';
import type {
  ListWorkspacesInputDto,
  ListWorkspacesOutputDto,
  ListWorkspacesUseCaseInterface,
} from '../usecase/list-workspaces/list-workspaces.usecase.dto';

export class WorkspaceFacade {
  constructor(
    private readonly createIndividualWorkspaceUseCase: CreateIndividualWorkspaceUseCaseInterface,
    private readonly listWorkspacesUseCase: ListWorkspacesUseCaseInterface,
  ) {}

  createIndividual(
    input: CreateIndividualWorkspaceInputDto,
  ): Promise<CreateIndividualWorkspaceOutputDto> {
    return this.createIndividualWorkspaceUseCase.execute(input);
  }

  list(input: ListWorkspacesInputDto): Promise<ListWorkspacesOutputDto> {
    return this.listWorkspacesUseCase.execute(input);
  }
}
