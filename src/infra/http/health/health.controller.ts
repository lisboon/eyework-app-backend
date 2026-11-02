import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready() {
    if (!(await this.healthService.isDatabaseReady())) {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }

    return { status: 'ok' };
  }
}
