import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

describe('HealthController', () => {
  const makeSut = (databaseReady = true) => {
    const healthService = {
      isDatabaseReady: jest.fn().mockResolvedValue(databaseReady),
    };
    const controller = new HealthController(
      healthService as unknown as HealthService,
    );
    return { controller, healthService };
  };

  it('should report the process as alive without checking the database', () => {
    const { controller, healthService } = makeSut();

    expect(controller.live()).toEqual({ status: 'ok' });
    expect(healthService.isDatabaseReady).not.toHaveBeenCalled();
  });

  it('should return ok when the database is ready', async () => {
    const { controller } = makeSut(true);

    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
  });

  it('should return 503 with status unavailable when the database is not ready', async () => {
    const { controller } = makeSut(false);

    const error = await controller.ready().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    const exception = error as ServiceUnavailableException;
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.getResponse()).toEqual({ status: 'unavailable' });
  });
});
