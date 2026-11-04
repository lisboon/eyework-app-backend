import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import type { RefreshToken } from '../domain/refresh-token.entity';

export interface RefreshTokenGateway {
  create(token: RefreshToken, trx?: TransactionContext): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string, trx?: TransactionContext): Promise<boolean>;
  revokeFamily(familyId: string): Promise<void>;
}
