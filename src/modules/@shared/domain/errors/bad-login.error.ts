export class BadLoginError extends Error {
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'BadLoginError';
  }
}
