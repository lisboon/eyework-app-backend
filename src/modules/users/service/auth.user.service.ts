import bcrypt from 'bcryptjs';
import type {
  AccessTokenPayload,
  TokenServiceInterface,
} from './token/token.service';

const BCRYPT_COST = 10;
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
    if (bcrypt.truncates(password)) {
      throw new Error('Password longer than 72 bytes');
    }
    return bcrypt.hash(password, BCRYPT_COST);
  }

  async comparePassword(
    password: string,
    hash: string | undefined,
  ): Promise<boolean> {
    const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
    return matches && hash !== undefined && !bcrypt.truncates(password);
  }

  generateToken(payload: AccessTokenPayload): string {
    return this.tokenService.generateToken(payload);
  }

  verifyToken(token: string): AccessTokenPayload {
    return this.tokenService.verifyToken(token);
  }
}
