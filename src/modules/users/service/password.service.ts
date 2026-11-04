import bcrypt from 'bcrypt';

const BCRYPT_COST = 10;
const BCRYPT_MAX_BYTES = 72;
const DUMMY_HASH =
  '$2b$10$Mhdxlp9/ly2Lkcc5OHyFzeV29ozWS8xC4/KNskf6ECWZF47ZOlID2';

export interface PasswordServiceInterface {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string | undefined): Promise<boolean>;
}

export class PasswordService implements PasswordServiceInterface {
  async hash(password: string): Promise<string> {
    if (exceedsBcryptLimit(password)) {
      throw new Error(`Password longer than ${BCRYPT_MAX_BYTES} bytes`);
    }
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async compare(password: string, hash: string | undefined): Promise<boolean> {
    const comparable = hash !== undefined && !exceedsBcryptLimit(password);
    const matches = await bcrypt.compare(
      password,
      comparable ? hash : DUMMY_HASH,
    );
    return comparable && matches;
  }
}

function exceedsBcryptLimit(password: string): boolean {
  return Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES;
}
