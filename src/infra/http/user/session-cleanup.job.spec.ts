import { Logger } from '@nestjs/common';
import type { UserFacade } from '@/modules/users/facade/user.facade';
import { SessionCleanupJob } from './session-cleanup.job';

describe('SessionCleanupJob', () => {
  const makeSut = (deleteExpiredSessions: jest.Mock) =>
    new SessionCleanupJob({
      deleteExpiredSessions,
    } as unknown as UserFacade);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete the expired sessions and log how many', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const job = makeSut(jest.fn().mockResolvedValue({ deleted: 2 }));

    await job.deleteExpiredSessions();

    expect(log).toHaveBeenCalledWith('Deleted 2 expired sessions');
  });

  it('should log the failure instead of throwing it', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const job = makeSut(jest.fn().mockRejectedValue(new Error('db down')));

    await expect(job.deleteExpiredSessions()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      'Could not delete expired sessions',
      expect.stringContaining('db down'),
    );
  });
});
