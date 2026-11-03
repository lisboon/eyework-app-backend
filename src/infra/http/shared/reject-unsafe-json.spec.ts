import type { Request, Response } from 'express';
import { rejectUnsafeJson } from './reject-unsafe-json';

describe('rejectUnsafeJson', () => {
  const nested = (levels: number): unknown =>
    JSON.parse(`${'['.repeat(levels)}${']'.repeat(levels)}`);

  const run = (body: unknown) => {
    const next = jest.fn();
    rejectUnsafeJson({ body } as Request, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    return next.mock.calls[0][0] as unknown;
  };

  it.each([
    ['no body', undefined],
    ['a flat body', { email: 'ana@example.com', password: 'x' }],
    ['an emoji made of a surrogate pair', { name: 'Ana \ud83d\ude00' }],
    ['32 levels of nesting', nested(32)],
    ['an own __proto__ key', JSON.parse('{"__proto__":{"a":"b"}}')],
  ])('should let %s through', (_, body) => {
    expect(run(body)).toBeUndefined();
  });

  it.each([
    ['a value', { email: 'ana\ud800@example.com' }],
    ['a key', { 'note\udc00': 'x' }],
    ['a nested array item', { tags: ['ok', ['x\ud800']] }],
  ])('should reject a lone surrogate in %s', (_, body) => {
    const error = run(body);

    expect(error).toBeInstanceOf(SyntaxError);
    expect((error as SyntaxError).message).toBe(
      'Request body contains invalid Unicode',
    );
  });

  it.each([33, 5000])('should reject %s levels of nesting', (levels) => {
    const error = run({ n: nested(levels - 1) });

    expect(error).toBeInstanceOf(SyntaxError);
    expect((error as SyntaxError).message).toBe(
      'Request body is nested deeper than 32 levels',
    );
  });
});
