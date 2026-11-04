import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserFacade } from '@/modules/users/facade/user.facade';

export const SESSION_CLEANUP_JOB = 'delete-expired-sessions';

@Injectable()
export class SessionCleanupJob {
  private readonly logger = new Logger(SessionCleanupJob.name);

  constructor(private readonly userFacade: UserFacade) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: SESSION_CLEANUP_JOB })
  async deleteExpiredSessions(): Promise<void> {
    try {
      const { deleted } = await this.userFacade.deleteExpiredSessions();
      this.logger.log(`Deleted ${deleted} expired sessions`);
    } catch (error) {
      this.logger.error(
        'Could not delete expired sessions',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
