import type { FieldsErrors } from './validator-fields-interface';

export class Notification {
  private readonly errors = new Map<string, string[] | string>();

  addError(error: string, field?: string): void {
    if (!field) {
      this.errors.set(error, error);
      return;
    }

    const messages = this.errors.get(field);
    const fieldMessages = Array.isArray(messages) ? messages : [];
    if (!fieldMessages.includes(error)) {
      fieldMessages.push(error);
    }
    this.errors.set(field, fieldMessages);
  }

  hasErrors(): boolean {
    return this.errors.size > 0;
  }

  toJSON(): FieldsErrors[] {
    const errors: FieldsErrors[] = [];
    this.errors.forEach((value, key) => {
      errors.push(typeof value === 'string' ? value : { [key]: value });
    });
    return errors;
  }
}
