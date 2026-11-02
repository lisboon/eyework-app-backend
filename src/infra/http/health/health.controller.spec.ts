import { HealthController } from './health.controller';

describe('HealthController', () => {
  const makeSut = () => {
    const controller = new HealthController();
    return { controller };
  };

  it('should report the process as alive', () => {
    const { controller } = makeSut();

    expect(controller.live()).toEqual({ status: 'ok' });
  });
});
