import { IsNotEmpty, Length } from 'class-validator';
import { ClassValidatorFields } from './class-validator-fields';
import { Notification } from './notification';

class SampleRules {
  @Length(2, 10, { groups: ['create'] })
  name: string;

  @IsNotEmpty({ groups: ['update'] })
  nickname: string;

  constructor(name: string, nickname: string) {
    this.name = name;
    this.nickname = nickname;
  }
}

class SampleValidator extends ClassValidatorFields {}

describe('ClassValidatorFields', () => {
  const makeSut = () => ({
    validator: new SampleValidator(),
    notification: new Notification(),
  });

  it('should return true and keep the notification empty for valid data', () => {
    const { validator, notification } = makeSut();

    const valid = validator.validate(
      notification,
      new SampleRules('Ana', 'ana'),
      ['create'],
    );

    expect(valid).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  it('should add the messages of each invalid field', () => {
    const { validator, notification } = makeSut();

    const valid = validator.validate(notification, new SampleRules('A', ''), [
      'create',
      'update',
    ]);

    expect(valid).toBe(false);
    expect(notification.toJSON()).toEqual([
      { name: ['name must be longer than or equal to 2 characters'] },
      { nickname: ['nickname should not be empty'] },
    ]);
  });

  it('should only run the rules of the requested groups', () => {
    const { validator, notification } = makeSut();

    const valid = validator.validate(notification, new SampleRules('Ana', ''), [
      'create',
    ]);

    expect(valid).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  it('should fail loudly when no rule belongs to the requested groups', () => {
    const { validator, notification } = makeSut();

    expect(() =>
      validator.validate(notification, new SampleRules('Ana', 'ana'), [
        'delete',
      ]),
    ).toThrow('SampleRules has no validation rules for the groups: delete');
  });
});
