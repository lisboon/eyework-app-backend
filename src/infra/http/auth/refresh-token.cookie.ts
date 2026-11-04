import type { CookieOptions, Request, Response } from 'express';
import type { Session } from '@/modules/users/service/session.service';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/auth',
};

export function sendSession(
  res: Response,
  session: Session,
): { accessToken: string } {
  res.cookie(REFRESH_TOKEN_COOKIE, session.refreshToken, {
    ...COOKIE_OPTIONS,
    expires: session.refreshTokenExpiresAt,
  });
  return { accessToken: session.accessToken };
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);
}

export function readRefreshTokenCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof value === 'string' && value !== '' ? value : undefined;
}
