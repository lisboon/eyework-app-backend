import { version } from 'uuid';
import { User, type UserProps } from './user.entity';

describe('User', () => {
  const makeProps = (overrides: Partial<UserProps> = {}): UserProps => ({
    name: 'Ana Souza',
    email: 'ana@example.com',
    password: '$2b$10$abcdefghijklmnopqrstuuJ9vY2v0yC6uS0c7qk8b1yQxQ0p3m2a',
    ...overrides,
  });

  it('should create a valid user with a UUID v7 id', () => {
    const user = User.create(makeProps());

    expect(user.notification.hasErrors()).toBe(false);
    expect(version(user.id)).toBe(7);
    expect(user.name).toBe('Ana Souza');
    expect(user.email).toBe('ana@example.com');
    expect(user.active).toBe(true);
    expect(user.deletedAt).toBeUndefined();
  });

  it('should trim the name and normalize the email', () => {
    const user = User.create(
      makeProps({ name: '  Ana Souza  ', email: '  Ana@Example.COM ' }),
    );

    expect(user.name).toBe('Ana Souza');
    expect(user.email).toBe('ana@example.com');
  });

  it.each([
    ['too short', 'A'],
    ['blank', '   '],
    ['too long', 'a'.repeat(121)],
  ])('should reject a name that is %s', (_, name) => {
    const user = User.create(makeProps({ name }));

    expect(user.notification.toJSON()).toEqual([{ name: expect.any(Array) }]);
  });

  it.each([
    ['without @', 'ana.example.com'],
    ['without domain', 'ana@'],
    ['longer than 254 characters', `${'a'.repeat(64)}@${'b'.repeat(250)}.com`],
  ])('should reject an email %s', (_, email) => {
    const user = User.create(makeProps({ email }));

    expect(user.notification.toJSON()).toEqual([{ email: expect.any(Array) }]);
  });

  it('should reject an empty password hash', () => {
    const user = User.create(makeProps({ password: '' }));

    expect(user.notification.toJSON()).toEqual([
      { password: expect.any(Array) },
    ]);
  });

  it('should keep the values of an existing user', () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z');
    const user = new User(
      makeProps({
        id: '019a4f7e-7c1b-7d40-9b1c-3f5e8a2d6c10',
        active: false,
        createdAt,
        updatedAt: createdAt,
      }),
    );

    expect(user.id).toBe('019a4f7e-7c1b-7d40-9b1c-3f5e8a2d6c10');
    expect(user.active).toBe(false);
    expect(user.createdAt).toBe(createdAt);
    expect(user.password).toBe(makeProps().password);
  });
});
