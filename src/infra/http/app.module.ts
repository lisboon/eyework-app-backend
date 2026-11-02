import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [DatabaseModule, HealthModule],
})
export class AppModule {}
