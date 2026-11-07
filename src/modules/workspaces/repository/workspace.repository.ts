import type {
  PrismaClient,
  Workspace as WorkspaceModel,
  WorkspaceMember as WorkspaceMemberModel,
} from '@/infra/database/generated/prisma/client';
import { isUniqueViolation } from '@/infra/database/prisma-errors';
import type { WorkspaceMembership } from '../domain/workspace-membership';
import { Workspace } from '../domain/workspace.entity';
import type { WorkspaceGateway } from '../gateway/workspace.gateway';

const ONE_INDIVIDUAL_WORKSPACE_PER_OWNER = 'Workspace_individualOwnerId_key';

type WorkspaceRow = WorkspaceModel & { members: WorkspaceMemberModel[] };

export class WorkspaceRepository implements WorkspaceGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async createIndividual(
    workspace: Workspace,
  ): Promise<{ workspace: Workspace; created: boolean }> {
    try {
      await this.prisma.workspace.create({
        data: {
          id: workspace.id,
          type: workspace.type,
          name: workspace.name,
          individualOwnerId: workspace.individualOwnerId,
          active: workspace.active,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          deletedAt: workspace.deletedAt,
          members: {
            create: workspace.members.map((member) => ({
              userId: member.userId,
              role: member.role,
              createdAt: workspace.createdAt,
            })),
          },
        },
      });
      return { workspace, created: true };
    } catch (error) {
      if (!isUniqueViolation(error, ONE_INDIVIDUAL_WORKSPACE_PER_OWNER)) {
        throw error;
      }
      const row = await this.prisma.workspace.findUniqueOrThrow({
        where: { individualOwnerId: workspace.individualOwnerId },
        include: { members: true },
      });
      return { workspace: this.toEntity(row), created: false };
    }
  }

  async findMembershipsOf(userId: string): Promise<WorkspaceMembership[]> {
    const rows = await this.prisma.workspaceMember.findMany({
      where: { userId, workspace: { active: true, deletedAt: null } },
      include: { workspace: true },
      orderBy: [{ createdAt: 'asc' }, { workspaceId: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.workspace.id,
      type: row.workspace.type,
      name: row.workspace.name,
      role: row.role,
    }));
  }

  private toEntity(row: WorkspaceRow): Workspace {
    return new Workspace({
      id: row.id,
      type: row.type,
      name: row.name,
      individualOwnerId: row.individualOwnerId ?? undefined,
      members: row.members.map((member) => ({
        userId: member.userId,
        role: member.role,
      })),
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    });
  }
}
