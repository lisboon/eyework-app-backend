import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';
import type { WorkspaceMembership } from '../../domain/workspace-membership';

export interface ListWorkspacesInputDto {
  userId: string;
}

export type ListWorkspacesOutputDto = WorkspaceMembership[];

export type ListWorkspacesUseCaseInterface = BaseUseCase<
  ListWorkspacesInputDto,
  ListWorkspacesOutputDto
>;
