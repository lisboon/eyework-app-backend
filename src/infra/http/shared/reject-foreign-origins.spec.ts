import { ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { rejectForeignOrigins } from './reject-foreign-origins';

describe('rejectForeignOrigins', () => {
  const middleware = rejectForeignOrigins(['https://app.example.com']);

  const run = (method: string, origin?: string) => {
    const next = jest.fn();
    middleware(
      { method, headers: { origin } } as Request,
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    return next.mock.calls[0][0] as unknown;
  };

  it.each([
    ['POST from the allowed origin', 'POST', 'https://app.example.com'],
    ['POST without an Origin header', 'POST', undefined],
    ['GET from another origin', 'GET', 'https://evil.example'],
    ['HEAD from another origin', 'HEAD', 'https://evil.example'],
    ['a preflight from another origin', 'OPTIONS', 'https://evil.example'],
  ])('should let %s through', (_, method, origin) => {
    expect(run(method, origin)).toBeUndefined();
  });

  it.each([
    ['POST', 'https://evil.example'],
    ['PUT', 'https://evil.example'],
    ['PATCH', 'https://evil.example'],
    ['DELETE', 'https://evil.example'],
    ['POST', 'https://evil.app.example.com'],
    ['POST', 'http://app.example.com'],
    ['POST', 'null'],
  ])('should reject %s from %s', (method, origin) => {
    const error = run(method, origin);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).message).toBe('Origin not allowed');
  });
});
