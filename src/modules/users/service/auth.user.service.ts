import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;

export interface AuthUserServiceInterface {
  hashPassword(password: string): Promise<string>;
}

export class AuthUserService implements AuthUserServiceInterface {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }
}
