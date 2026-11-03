import { Prisma } from './generated/prisma/client';
import { translateUniqueViolation } from './prisma-errors';

describe('translateUniqueViolation', () => {
  const makeKnownError = (code: string, index?: string) =>
    new Prisma.PrismaClientKnownRequestError('Prisma error', {
      code,
      clientVersion: '7.10.1',
      meta: {
        modelName: 'User',
        driverAdapterError: {
          name: 'DriverAdapterError',
          cause: {
            kind: 'UniqueConstraintViolation',
            constraint: { index },
          },
        },
      },
    });

  const translated = new Error('Email already registered');
  const toError = () => translated;

  it('should return the result when the operation succeeds', async () => {
    await expect(
      translateUniqueViolation(async () => 'ok', 'User_email_key', toError),
    ).resolves.toBe('ok');
  });

  it('should translate a unique violation on the given index', async () => {
    const error = makeKnownError('P2002', 'User_email_key');

    await expect(
      translateUniqueViolation(
        () => Promise.reject(error),
        'User_email_key',
        toError,
      ),
    ).rejects.toBe(translated);
  });

  it('should rethrow a unique violation on another index', async () => {
    const error = makeKnownError('P2002', 'User_phone_key');

    await expect(
      translateUniqueViolation(
        () => Promise.reject(error),
        'User_email_key',
        toError,
      ),
    ).rejects.toBe(error);
  });

  it('should rethrow other Prisma errors', async () => {
    const error = makeKnownError('P2025', 'User_email_key');

    await expect(
      translateUniqueViolation(
        () => Promise.reject(error),
        'User_email_key',
        toError,
      ),
    ).rejects.toBe(error);
  });

  it('should rethrow errors that do not come from Prisma', async () => {
    const error = new Error('connection lost');

    await expect(
      translateUniqueViolation(
        () => Promise.reject(error),
        'User_email_key',
        toError,
      ),
    ).rejects.toBe(error);
  });
});
