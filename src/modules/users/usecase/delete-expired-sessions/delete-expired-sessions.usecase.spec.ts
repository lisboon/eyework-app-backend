import { DeleteExpiredSessionsUseCase } from './delete-expired-sessions.usecase';

describe('DeleteExpiredSessionsUseCase', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delete the families that expired by now and report how many', async () => {
    const now = new Date('2026-12-03T03:00:00.000Z');
    jest.useFakeTimers({ now });
    const refreshTokenGateway = {
      deleteExpiredFamilies: jest.fn().mockResolvedValue(3),
    };

    const output = await new DeleteExpiredSessionsUseCase(
      refreshTokenGateway,
    ).execute();

    expect(output).toEqual({ deleted: 3 });
    expect(refreshTokenGateway.deleteExpiredFamilies).toHaveBeenCalledWith(now);
  });
});
