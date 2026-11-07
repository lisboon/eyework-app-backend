import type { UserFacade } from '@/modules/users/facade/user.facade';
import type { WorkspaceGateway } from '../../gateway/workspace.gateway';
import type {
  ListWorkspacesInputDto,
  ListWorkspacesOutputDto,
  ListWorkspacesUseCaseInterface,
} from './list-workspaces.usecase.dto';

export class ListWorkspacesUseCase implements ListWorkspacesUseCaseInterface {
  constructor(
    private readonly workspaceGateway: Pick<
      WorkspaceGateway,
      'findMembershipsOf'
    >,
    private readonly userFacade: Pick<UserFacade, 'findMe'>,
  ) {}

  async execute(
    input: ListWorkspacesInputDto,
  ): Promise<ListWorkspacesOutputDto> {
    const user = await this.userFacade.findMe({ id: input.userId });
    return this.workspaceGateway.findMembershipsOf(user.id);
  }
}
