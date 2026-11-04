import type { Prisma, PrismaClient } from './generated/prisma/client';
import { PrismaTransactionContext } from './prisma-transaction.context';
import { PrismaTransactionManager } from './prisma-transaction.manager';

describe('PrismaTransactionManager', () => {
  const transactionClient = { user: {} } as Prisma.TransactionClient;

  const makeSut = () => {
    const $transaction = jest.fn(
      (work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(transactionClient),
    );
    const manager = new PrismaTransactionManager({
      $transaction,
    } as unknown as PrismaClient);
    return { manager, $transaction };
  };

  it("should run the work inside Prisma's transaction with an opaque context", async () => {
    const { manager, $transaction } = makeSut();

    const result = await manager.execute(async (trx) => {
      expect(trx).toBeInstanceOf(PrismaTransactionContext);
      expect((trx as PrismaTransactionContext).client).toBe(transactionClient);
      return 'committed';
    });

    expect(result).toBe('committed');
    expect($transaction).toHaveBeenCalledTimes(1);
  });

  it('should pass the failure of the work on to Prisma, which rolls back', async () => {
    const { manager } = makeSut();
    const failure = new Error('session storage failed');

    await expect(manager.execute(() => Promise.reject(failure))).rejects.toBe(
      failure,
    );
  });
});
