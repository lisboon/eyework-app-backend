import { decode, sign } from 'jsonwebtoken';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const secret = 'test-secret-with-at-least-32-characters';
  const makeSut = (expiresInSeconds = 900) =>
    new TokenService(secret, expiresInSeconds);

  it('should sign an HS256 token with the user id and the configured lifetime', () => {
    const token = makeSut(900).generateToken({ sub: 'user-1' });

    const decoded = decode(token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
    const payload = decoded?.payload as {
      sub: string;
      iat: number;
      exp: number;
    };
    expect(payload.sub).toBe('user-1');
    expect(payload.exp - payload.iat).toBe(900);
  });

  it('should verify a token it signed', () => {
    const service = makeSut();

    const token = service.generateToken({ sub: 'user-1' });

    expect(service.verifyToken(token)).toEqual({ sub: 'user-1' });
  });

  it('should reject an expired token', () => {
    const token = sign(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 },
      secret,
    );

    expect(() => makeSut().verifyToken(token)).toThrow('jwt expired');
  });

  it('should reject a token signed with another secret', () => {
    const token = sign(
      { sub: 'user-1' },
      'another-secret-with-32-characters!!',
    );

    expect(() => makeSut().verifyToken(token)).toThrow('invalid signature');
  });

  it('should reject a token signed with another algorithm', () => {
    const token = sign({ sub: 'user-1' }, secret, { algorithm: 'HS512' });

    expect(() => makeSut().verifyToken(token)).toThrow('invalid algorithm');
  });

  it('should reject a token without a subject', () => {
    const token = sign({ role: 'admin' }, secret);

    expect(() => makeSut().verifyToken(token)).toThrow('Invalid token payload');
  });
});
