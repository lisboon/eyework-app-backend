import type { RefreshToken } from '../domain/refresh-token.entity';

export interface RefreshTokenGateway {
  create(token: RefreshToken): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<boolean>;
  revokeFamily(familyId: string): Promise<void>;
}
