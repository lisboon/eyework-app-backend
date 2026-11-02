import { Logger } from '@nestjs/common';
import type { PrismaService } from '@/infra/database/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const makeSut = () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };
    const service = new HealthService(prisma as unknown as PrismaService);
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    return { service, prisma, warn };
  };

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should report the database as ready when it answers', async () => {
    const { service, prisma, warn } = makeSut();

    await expect(service.isDatabaseReady()).resolves.toBe(true);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should report not ready and log the reason in one line when the query fails', async () => {
    const { service, prisma, warn } = makeSut();
    prisma.$queryRaw.mockRejectedValue(
      new Error('\nInvalid invocation:\n\n  pool failed\n'),
    );

    await expect(service.isDatabaseReady()).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(
      'Database unavailable: Invalid invocation: pool failed',
    );
  });

  it('should stop waiting and report not ready when the database hangs', async () => {
    jest.useFakeTimers();
    const { service, prisma, warn } = makeSut();
    prisma.$queryRaw.mockReturnValue(new Promise(() => undefined));

    const result = service.isDatabaseReady();
    await jest.runOnlyPendingTimersAsync();

    await expect(result).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('No response within'),
    );
  });
});
