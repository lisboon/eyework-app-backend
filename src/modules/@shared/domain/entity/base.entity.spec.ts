import { validate, version } from 'uuid';
import { BaseEntity } from './base.entity';

class SampleEntity extends BaseEntity {}

describe('BaseEntity', () => {
  it('should generate a UUID v7 id and default lifecycle fields', () => {
    const entity = new SampleEntity();

    expect(validate(entity.id)).toBe(true);
    expect(version(entity.id)).toBe(7);
    expect(entity.active).toBe(true);
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.deletedAt).toBeUndefined();
    expect(entity.notification.hasErrors()).toBe(false);
  });

  it('should generate ids in creation order', () => {
    const ids = Array.from({ length: 50 }, () => new SampleEntity().id);

    expect([...ids].sort()).toEqual(ids);
  });

  it('should keep the values of an existing entity', () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z');
    const updatedAt = new Date('2026-01-02T10:00:00.000Z');
    const deletedAt = new Date('2026-01-03T10:00:00.000Z');

    const entity = new SampleEntity(
      '019a4f7e-7c1b-7d40-9b1c-3f5e8a2d6c10',
      createdAt,
      updatedAt,
      false,
      deletedAt,
    );

    expect(entity.id).toBe('019a4f7e-7c1b-7d40-9b1c-3f5e8a2d6c10');
    expect(entity.createdAt).toBe(createdAt);
    expect(entity.updatedAt).toBe(updatedAt);
    expect(entity.active).toBe(false);
    expect(entity.deletedAt).toBe(deletedAt);
  });
});
