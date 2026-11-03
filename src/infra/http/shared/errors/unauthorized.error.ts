import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { BadLoginError } from '@/modules/@shared/domain/errors/bad-login.error';
import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';

@Catch(BadLoginError, UnauthorizedError)
export class UnauthorizedErrorFilter implements ExceptionFilter {
  catch(
    exception: BadLoginError | UnauthorizedError,
    host: ArgumentsHost,
  ): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.UNAUTHORIZED)
      .json({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message: exception.message,
      });
  }
}
