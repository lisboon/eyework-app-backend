import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';
import type { WorkspaceMembership } from '../../domain/workspace-membership';

export interface CreateIndividualWorkspaceInputDto {
  userId: string;
}

export interface CreateIndividualWorkspaceOutputDto extends WorkspaceMembership {
  created: boolean;
}

export type CreateIndividualWorkspaceUseCaseInterface = BaseUseCase<
  CreateIndividualWorkspaceInputDto,
  CreateIndividualWorkspaceOutputDto
>;
