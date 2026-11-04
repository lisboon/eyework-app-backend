import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function rejectForeignOrigins(
  allowedOrigins: readonly string[],
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const foreign =
      !SAFE_METHODS.has(req.method) &&
      origin !== undefined &&
      !allowedOrigins.includes(origin);
    next(foreign ? new ForbiddenException('Origin not allowed') : undefined);
  };
}
