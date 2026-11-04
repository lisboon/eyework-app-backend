import type {
  TransactionContext,
  TransactionManager,
} from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import type { PrismaClient } from './generated/prisma/client';
import { PrismaTransactionContext } from './prisma-transaction.context';

export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaClient) {}

  execute<T>(work: (trx: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((client) =>
      work(new PrismaTransactionContext(client)),
    );
  }
}
