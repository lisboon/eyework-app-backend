import { BaseEntity } from '@/modules/@shared/domain/entity/base.entity';
import { UserValidator } from './validators/user.validator';

export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User extends BaseEntity {
  private readonly _name: string;
  private readonly _email: string;
  private readonly _password: string;

  constructor(props: UserProps) {
    super(
      props.id,
      props.createdAt,
      props.updatedAt,
      props.active,
      props.deletedAt,
    );
    this._name = props.name.trim();
    this._email = props.email.trim().toLowerCase();
    this._password = props.password;
  }

  static create(props: UserProps): User {
    const user = new User(props);
    user.validate(['create']);
    return user;
  }

  validate(fields: string[]): boolean {
    return new UserValidator().validate(this._notification, this, fields);
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }
}
