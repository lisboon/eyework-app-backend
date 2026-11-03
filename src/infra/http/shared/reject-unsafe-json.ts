import type { NextFunction, Request, Response } from 'express';

const MAX_DEPTH = 32;
const LONE_SURROGATE = /\p{Surrogate}/u;
const INVALID_UNICODE = 'Request body contains invalid Unicode';
const TOO_DEEP = `Request body is nested deeper than ${MAX_DEPTH} levels`;

export function rejectUnsafeJson(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const problem = problemIn(req.body, 1);
  next(problem ? new SyntaxError(problem) : undefined);
}

function problemIn(value: unknown, depth: number): string | undefined {
  if (typeof value === 'string') {
    return LONE_SURROGATE.test(value) ? INVALID_UNICODE : undefined;
  }
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  if (depth > MAX_DEPTH) {
    return TOO_DEEP;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const problem = problemIn(item, depth + 1);
      if (problem) return problem;
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key in record) {
    const problem = LONE_SURROGATE.test(key)
      ? INVALID_UNICODE
      : problemIn(record[key], depth + 1);
    if (problem) return problem;
  }
  return undefined;
}
