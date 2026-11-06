import type { WorkspaceMembership } from '../domain/workspace-membership';
import type { Workspace } from '../domain/workspace.entity';

export interface WorkspaceGateway {
  createIndividual(
    workspace: Workspace,
  ): Promise<{ workspace: Workspace; created: boolean }>;
  findMembershipsOf(userId: string): Promise<WorkspaceMembership[]>;
}
