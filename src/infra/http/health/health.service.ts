import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma.service';

const DATABASE_CHECK_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseReady(): Promise<boolean> {
    try {
      await withTimeout(
        this.prisma.$queryRaw`SELECT 1`,
        DATABASE_CHECK_TIMEOUT_MS,
      );
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Database unavailable: ${reason.replace(/\s+/g, ' ').trim()}`,
      );
      return false;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`No response within ${ms} ms`)),
      ms,
    );
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
