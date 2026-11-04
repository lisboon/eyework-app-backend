import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import type { User } from '../domain/user.entity';

export interface UserGateway {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User, trx?: TransactionContext): Promise<void>;
}
