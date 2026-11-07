import type { UserFacade } from '@/modules/users/facade/user.facade';
import { Workspace } from '../../domain/workspace.entity';
import type { WorkspaceGateway } from '../../gateway/workspace.gateway';
import type {
  CreateIndividualWorkspaceInputDto,
  CreateIndividualWorkspaceOutputDto,
  CreateIndividualWorkspaceUseCaseInterface,
} from './create-individual-workspace.usecase.dto';

export class CreateIndividualWorkspaceUseCase implements CreateIndividualWorkspaceUseCaseInterface {
  constructor(
    private readonly workspaceGateway: Pick<
      WorkspaceGateway,
      'createIndividual'
    >,
    private readonly userFacade: Pick<UserFacade, 'findMe'>,
  ) {}

  async execute(
    input: CreateIndividualWorkspaceInputDto,
  ): Promise<CreateIndividualWorkspaceOutputDto> {
    const owner = await this.userFacade.findMe({ id: input.userId });
    const { workspace, created } = await this.workspaceGateway.createIndividual(
      Workspace.createIndividual(owner),
    );

    return {
      id: workspace.id,
      type: workspace.type,
      name: workspace.name,
      role: 'OWNER',
      created,
    };
  }
}
