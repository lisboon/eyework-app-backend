import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [DatabaseModule, HealthModule, UserModule],
})
export class AppModule {}
