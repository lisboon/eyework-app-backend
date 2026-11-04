import type { ThrottlerOptions } from '@nestjs/throttler';
import { User } from '@/modules/users/domain/user.entity';

const MINUTE = 60_000;

export const RATE_LIMITS: ThrottlerOptions[] = [
  { name: 'ip', limit: 5, ttl: MINUTE },
  { name: 'email', limit: 10, ttl: 15 * MINUTE, getTracker: emailOf },
];

export const REFRESH_RATE_LIMIT = { ip: { limit: 20, ttl: MINUTE } };

function emailOf(req: { body?: { email?: unknown } }): string {
  const email = req.body?.email;
  return typeof email === 'string' ? User.normalizeEmail(email) : '';
}
