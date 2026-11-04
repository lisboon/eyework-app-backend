import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { TokenService } from '@/modules/users/service/token/token.service';
import { AuthGuard, type AuthenticatedRequest } from './auth-guard';

describe('AuthGuard', () => {
  const makeContext = (authorization?: string) => {
    const request = { headers: { authorization } } as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  const makeSut = () => {
    const tokenService = {
      verifyToken: jest.fn().mockReturnValue({ sub: 'user-1' }),
    };
    const guard = new AuthGuard(tokenService as unknown as TokenService);
    return { guard, tokenService };
  };

  it.each(['Bearer', 'bearer', 'BEARER'])(
    'should accept the %s scheme and attach the user id',
    (scheme) => {
      const { guard, tokenService } = makeSut();
      const { context, request } = makeContext(`${scheme} Valid-Token`);

      expect(guard.canActivate(context)).toBe(true);
      expect(tokenService.verifyToken).toHaveBeenCalledWith('Valid-Token');
      expect(request.user).toEqual({ id: 'user-1' });
    },
  );

  it.each([
    [undefined],
    [''],
    ['Bearer'],
    ['Bearer '],
    ['Basic abc'],
    ['token'],
  ])('should reject a missing or malformed header (%s)', (authorization) => {
    const { guard, tokenService } = makeSut();
    const { context } = makeContext(authorization);

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Missing access token'),
    );
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });

  it('should reject a token that cannot be verified', () => {
    const { guard, tokenService } = makeSut();
    tokenService.verifyToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const { context, request } = makeContext('Bearer expired-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid access token');
    expect(request.user).toBeUndefined();
  });
});
