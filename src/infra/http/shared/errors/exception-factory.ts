import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { constraintMessages } from '@/modules/@shared/domain/entity/validators/constraint-messages';

export function exceptionFactory(
  errors: ValidationError[],
): UnprocessableEntityException {
  return new UnprocessableEntityException(
    errors.map((error) => ({ [error.property]: constraintMessages(error) })),
  );
}
