import { createHash, randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';

export interface RefreshTokenProps {
  id?: string;
  userId: string;
  familyId?: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  familyRevokedAt?: Date;
  createdAt?: Date;
}

export class RefreshToken {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _familyId: string;
  private readonly _tokenHash: string;
  private readonly _expiresAt: Date;
  private readonly _revokedAt: Date | undefined;
  private readonly _familyRevokedAt: Date | undefined;
  private readonly _createdAt: Date;

  constructor(props: RefreshTokenProps) {
    this._id = props.id ?? uuidv7();
    this._userId = props.userId;
    this._familyId = props.familyId ?? uuidv7();
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
    this._familyRevokedAt = props.familyRevokedAt;
    this._createdAt = props.createdAt ?? new Date();
  }

  static generate(): string {
    return randomBytes(32).toString('base64url');
  }

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  isExpired(now: Date): boolean {
    return this._expiresAt <= now;
  }

  isRevoked(): boolean {
    return this._revokedAt !== undefined;
  }

  isFamilyRevoked(): boolean {
    return this._familyRevokedAt !== undefined;
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get familyId(): string {
    return this._familyId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | undefined {
    return this._revokedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
