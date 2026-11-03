import { Prisma } from './generated/prisma/client';

type DriverAdapterErrorMeta = {
  cause?: { constraint?: { index?: string } };
};

export async function translateUniqueViolation<T>(
  operation: () => Promise<T>,
  index: string,
  toError: () => Error,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isUniqueViolation(error, index)) {
      throw toError();
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown, index: string): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  const driverError = error.meta?.driverAdapterError as
    DriverAdapterErrorMeta | undefined;
  return driverError?.cause?.constraint?.index === index;
}
