import type { WorkspaceRole, WorkspaceType } from './workspace.entity';

export interface WorkspaceMembership {
  id: string;
  type: WorkspaceType;
  name: string;
  role: WorkspaceRole;
}
