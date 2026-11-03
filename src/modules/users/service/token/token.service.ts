import { sign, verify } from 'jsonwebtoken';

export interface AccessTokenPayload {
  sub: string;
}

export interface TokenServiceInterface {
  generateToken(payload: AccessTokenPayload): string;
  verifyToken(token: string): AccessTokenPayload;
}

export class TokenService implements TokenServiceInterface {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  generateToken(payload: AccessTokenPayload): string {
    return sign({ sub: payload.sub }, this.secret, {
      algorithm: 'HS256',
      expiresIn: this.expiresInSeconds,
    });
  }

  verifyToken(token: string): AccessTokenPayload {
    const payload = verify(token, this.secret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Invalid token payload');
    }
    return { sub: payload.sub };
  }
}
