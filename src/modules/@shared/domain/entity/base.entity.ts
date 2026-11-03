import { v7 as uuidv7 } from 'uuid';
import { Notification } from './validators/notification';

export abstract class BaseEntity {
  protected readonly _notification = new Notification();
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected _active: boolean;
  protected _deletedAt: Date | undefined;

  constructor(
    id: string = uuidv7(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    active: boolean = true,
    deletedAt?: Date,
  ) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._active = active;
    this._deletedAt = deletedAt;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get active(): boolean {
    return this._active;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get notification(): Notification {
    return this._notification;
  }
}
