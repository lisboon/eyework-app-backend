import { validateSync, type ValidationError } from 'class-validator';
import type { Notification } from './notification';
import type { IValidatorFields } from './validator-fields-interface';

export abstract class ClassValidatorFields implements IValidatorFields {
  validate(
    notification: Notification,
    data: object,
    fields: string[],
  ): boolean {
    const errors = validateSync(data, { groups: fields });
    errors.forEach((error) => addErrors(notification, error, error.property));
    return errors.length === 0;
  }
}

function addErrors(
  notification: Notification,
  error: ValidationError,
  field: string,
): void {
  Object.values(error.constraints ?? {}).forEach((message) =>
    notification.addError(message, field),
  );
  error.children?.forEach((child) => addErrors(notification, child, field));
}
