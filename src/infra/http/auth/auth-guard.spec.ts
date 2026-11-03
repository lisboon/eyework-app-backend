import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthUserService } from '@/modules/users/service/auth.user.service';
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
    const authUserService = {
      verifyToken: jest.fn().mockReturnValue({ sub: 'user-1' }),
    };
    const guard = new AuthGuard(authUserService as unknown as AuthUserService);
    return { guard, authUserService };
  };

  it('should accept a valid bearer token and attach the user id', () => {
    const { guard, authUserService } = makeSut();
    const { context, request } = makeContext('Bearer valid-token');

    expect(guard.canActivate(context)).toBe(true);
    expect(authUserService.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it.each([
    [undefined],
    [''],
    ['Bearer'],
    ['Bearer '],
    ['Basic abc'],
    ['token'],
  ])('should reject a missing or malformed header (%s)', (authorization) => {
    const { guard, authUserService } = makeSut();
    const { context } = makeContext(authorization);

    expect(() => guard.canActivate(context)).toThrow(
      new UnauthorizedException('Missing access token'),
    );
    expect(authUserService.verifyToken).not.toHaveBeenCalled();
  });

  it('should reject a token that cannot be verified', () => {
    const { guard, authUserService } = makeSut();
    authUserService.verifyToken.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const { context, request } = makeContext('Bearer expired-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Invalid access token');
    expect(request.user).toBeUndefined();
  });
});
