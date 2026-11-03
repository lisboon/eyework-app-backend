import { Notification } from './notification';

describe('Notification', () => {
  it('should start without errors', () => {
    const notification = new Notification();

    expect(notification.hasErrors()).toBe(false);
    expect(notification.toJSON()).toEqual([]);
  });

  it('should group messages by field without duplicates', () => {
    const notification = new Notification();

    notification.addError('is required', 'name');
    notification.addError('is required', 'name');
    notification.addError('is too short', 'name');
    notification.addError('is invalid', 'email');

    expect(notification.hasErrors()).toBe(true);
    expect(notification.toJSON()).toEqual([
      { name: ['is required', 'is too short'] },
      { email: ['is invalid'] },
    ]);
  });

  it('should keep errors without a field as plain messages', () => {
    const notification = new Notification();

    notification.addError('Something went wrong');

    expect(notification.toJSON()).toEqual(['Something went wrong']);
  });
});
