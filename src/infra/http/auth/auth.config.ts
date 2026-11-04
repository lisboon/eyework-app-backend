export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}

const MIN_SECRET_LENGTH = 32;
const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3600, d: 86400 } as const;

export function authConfigFromEnv(env: NodeJS.ProcessEnv): AuthConfig {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must have at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  return {
    jwtSecret,
    jwtExpiresInSeconds: toSeconds(
      'JWT_EXPIRES_IN',
      env.JWT_EXPIRES_IN ?? '15m',
    ),
    refreshTokenExpiresInSeconds: toSeconds(
      'REFRESH_TOKEN_EXPIRES_IN',
      env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
    ),
  };
}

function toSeconds(name: string, duration: string): number {
  const match = /^([1-9]\d*)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(
      `${name} must look like 30s, 15m, 2h or 1d. Received "${duration}".`,
    );
  }

  const unit = match[2] as keyof typeof SECONDS_PER_UNIT;
  return Number(match[1]) * SECONDS_PER_UNIT[unit];
}
