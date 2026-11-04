import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';
import { RefreshTokenReuseError } from '@/modules/users/domain/refresh-token-reuse.error';

@Catch(BadLoginError, UnauthorizedError)
export class UnauthorizedErrorFilter implements ExceptionFilter {
  private readonly securityLogger = new Logger('Security');

  catch(
    exception: BadLoginError | UnauthorizedError,
    host: ArgumentsHost,
  ): void {
    const http = host.switchToHttp();
    this.logSecurityEvent(exception, http.getRequest<Request>());
    http.getResponse<Response>().status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: 'Unauthorized',
      message: exception.message,
    });
  }

  private logSecurityEvent(exception: Error, request: Request): void {
    if (exception instanceof RefreshTokenReuseError) {
      this.securityLogger.warn(
        `Refresh token reused: revoked family ${exception.familyId} of user ${exception.userId}, request from ${request.ip}`,
      );
    } else if (exception instanceof BadLoginError) {
      this.securityLogger.log(`Login failed from ${request.ip}`);
    }
  }
}
