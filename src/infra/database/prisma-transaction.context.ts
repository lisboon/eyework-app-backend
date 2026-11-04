import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import type { Prisma, PrismaClient } from './generated/prisma/client';

export class PrismaTransactionContext extends TransactionContext {
  constructor(readonly client: Prisma.TransactionClient) {
    super();
  }
}

export function resolvePrismaClient(
  prisma: PrismaClient,
  trx?: TransactionContext,
): PrismaClient | Prisma.TransactionClient {
  if (!trx) {
    return prisma;
  }
  if (trx instanceof PrismaTransactionContext) {
    return trx.client;
  }
  throw new Error('Unsupported transaction context');
}
