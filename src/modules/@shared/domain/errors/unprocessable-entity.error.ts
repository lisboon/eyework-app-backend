import type { FieldsErrors } from '../entity/validators/validator-fields-interface';

export class EntityValidationError extends Error {
  constructor(public readonly error: FieldsErrors[]) {
    super('Unable to process the request with the given parameters');
    this.name = 'EntityValidationError';
  }
}
