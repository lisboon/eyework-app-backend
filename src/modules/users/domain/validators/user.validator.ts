import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ClassValidatorFields } from '@/modules/@shared/domain/entity/validators/class-validator-fields';
import type { Notification } from '@/modules/@shared/domain/entity/validators/notification';
import type { User } from '../user.entity';

export class UserRules {
  @IsString({ groups: ['create'] })
  @Length(2, 120, { groups: ['create'] })
  name: string;

  @IsEmail({}, { groups: ['create'] })
  @MaxLength(254, { groups: ['create'] })
  email: string;

  @IsString({ groups: ['create'] })
  @IsNotEmpty({ groups: ['create'] })
  password: string;

  constructor(user: User) {
    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
  }
}

export class UserValidator extends ClassValidatorFields {
  validate(notification: Notification, user: User, fields: string[]): boolean {
    return super.validate(notification, new UserRules(user), fields);
  }
}
