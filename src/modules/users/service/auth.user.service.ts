import bcrypt from 'bcrypt';
import type {
  AccessTokenPayload,
  TokenServiceInterface,
} from './token/token.service';

const BCRYPT_COST = 10;
const BCRYPT_MAX_BYTES = 72;
const DUMMY_HASH =
  '$2b$10$Mhdxlp9/ly2Lkcc5OHyFzeV29ozWS8xC4/KNskf6ECWZF47ZOlID2';

export interface AuthUserServiceInterface {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string | undefined): Promise<boolean>;
  generateToken(payload: AccessTokenPayload): string;
  verifyToken(token: string): AccessTokenPayload;
}

export class AuthUserService implements AuthUserServiceInterface {
  constructor(private readonly tokenService: TokenServiceInterface) {}

  async hashPassword(password: string): Promise<string> {
    if (exceedsBcryptLimit(password)) {
      throw new Error(`Password longer than ${BCRYPT_MAX_BYTES} bytes`);
    }
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async comparePassword(
    password: string,
    hash: string | undefined,
  ): Promise<boolean> {
    const comparable = hash !== undefined && !exceedsBcryptLimit(password);
    const matches = await bcrypt.compare(
      password,
      comparable ? hash : DUMMY_HASH,
    );
    return comparable && matches;
  }

  generateToken(payload: AccessTokenPayload): string {
    return this.tokenService.generateToken(payload);
  }

  verifyToken(token: string): AccessTokenPayload {
    return this.tokenService.verifyToken(token);
  }
}

function exceedsBcryptLimit(password: string): boolean {
  return Buffer.byteLength(password, 'utf8') > BCRYPT_MAX_BYTES;
}
