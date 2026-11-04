import { type ArgumentsHost, Logger } from '@nestjs/common';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import { RefreshTokenReuseError } from '@/modules/users/domain/refresh-token-reuse.error';
import { UnauthorizedErrorFilter } from './unauthorized.error';

describe('UnauthorizedErrorFilter', () => {
  const makeHost = () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '203.0.113.1' }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    return { host, response };
  };

  const spyOnLogger = () => ({
    log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
    warn: jest.spyOn(Logger.prototype, 'warn').mockImplementation(),
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should answer 401 and log a failed login without the email', () => {
    const { host, response } = makeHost();
    const logger = spyOnLogger();

    new UnauthorizedErrorFilter().catch(new BadLoginError(), host);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    expect(logger.log).toHaveBeenCalledWith('Login failed from 203.0.113.1');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should answer the same 401 as any invalid token and warn about a reused refresh token', () => {
    const { host, response } = makeHost();
    const logger = spyOnLogger();

    new UnauthorizedErrorFilter().catch(
      new RefreshTokenReuseError('user-1', 'family-1'),
      host,
    );

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Refresh token reused: revoked family family-1 of user user-1, request from 203.0.113.1',
    );
  });

  it('should answer 401 without logging other unauthorized errors', () => {
    const { host, response } = makeHost();
    const logger = spyOnLogger();

    new UnauthorizedErrorFilter().catch(
      new UnauthorizedError('Invalid refresh token'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
