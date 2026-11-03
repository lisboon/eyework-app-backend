import { validateSync } from 'class-validator';
import { constraintMessages } from './constraint-messages';
import type { Notification } from './notification';
import type { IValidatorFields } from './validator-fields-interface';

export abstract class ClassValidatorFields implements IValidatorFields {
  validate(
    notification: Notification,
    data: object,
    fields: string[],
  ): boolean {
    const errors = validateSync(data, { groups: fields });

    if (errors.some((error) => error.constraints?.unknownValue)) {
      throw new Error(
        `${data.constructor.name} has no validation rules for the groups: ${fields.join(', ')}`,
      );
    }

    errors.forEach((error) =>
      constraintMessages(error).forEach((message) =>
        notification.addError(message, error.property),
      ),
    );
    return errors.length === 0;
  }
}
