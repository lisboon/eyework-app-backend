import { BaseEntity } from '@/modules/@shared/domain/entity/base.entity';

export type WorkspaceType = 'COMPANY' | 'INDIVIDUAL';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'RECRUITER';

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
}

export interface WorkspaceProps {
  id?: string;
  type: WorkspaceType;
  name: string;
  individualOwnerId?: string;
  members?: WorkspaceMember[];
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Workspace extends BaseEntity {
  private readonly _type: WorkspaceType;
  private readonly _name: string;
  private readonly _individualOwnerId: string | undefined;
  private readonly _members: WorkspaceMember[];

  constructor(props: WorkspaceProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._type = props.type;
    this._name = props.name;
    this._individualOwnerId = props.individualOwnerId;
    this._members = props.members ?? [];
  }

  static createIndividual(owner: { id: string; name: string }): Workspace {
    return new Workspace({
      type: 'INDIVIDUAL',
      name: owner.name,
      individualOwnerId: owner.id,
      members: [{ userId: owner.id, role: 'OWNER' }],
    });
  }

  get type(): WorkspaceType {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get individualOwnerId(): string | undefined {
    return this._individualOwnerId;
  }

  get members(): readonly WorkspaceMember[] {
    return this._members;
  }
}
