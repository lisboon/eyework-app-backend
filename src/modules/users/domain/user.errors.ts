import { EntityValidationError } from '@/modules/@shared/domain/errors/unprocessable-entity.error';

export function emailAlreadyRegisteredError(): EntityValidationError {
  return new EntityValidationError([{ email: ['Email already registered'] }]);
}
