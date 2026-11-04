import { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import type { Prisma, PrismaClient } from './generated/prisma/client';
import {
  PrismaTransactionContext,
  resolvePrismaClient,
} from './prisma-transaction.context';

describe('resolvePrismaClient', () => {
  const prisma = { user: {} } as unknown as PrismaClient;
  const transactionClient = { user: {} } as Prisma.TransactionClient;

  it('should use the regular client outside a transaction', () => {
    expect(resolvePrismaClient(prisma)).toBe(prisma);
  });

  it('should use the transaction client inside a Prisma transaction', () => {
    expect(
      resolvePrismaClient(
        prisma,
        new PrismaTransactionContext(transactionClient),
      ),
    ).toBe(transactionClient);
  });

  it('should refuse a context that does not come from Prisma', () => {
    class OtherContext extends TransactionContext {
      constructor() {
        super();
      }
    }

    expect(() => resolvePrismaClient(prisma, new OtherContext())).toThrow(
      'Unsupported transaction context',
    );
  });
});
