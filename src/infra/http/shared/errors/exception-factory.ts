import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function exceptionFactory(
  errors: ValidationError[],
): UnprocessableEntityException {
  return new UnprocessableEntityException(
    errors.map((error) => ({ [error.property]: messagesOf(error) })),
  );
}

function messagesOf(error: ValidationError): string[] {
  return [
    ...Object.values(error.constraints ?? {}),
    ...(error.children ?? []).flatMap(messagesOf),
  ];
}
