import type { ValidationError } from 'class-validator';

export function constraintMessages(error: ValidationError): string[] {
  return [
    ...Object.values(error.constraints ?? {}),
    ...(error.children ?? []).flatMap(constraintMessages),
  ];
}
