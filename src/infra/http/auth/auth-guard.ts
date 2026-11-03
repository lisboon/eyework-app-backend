import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthUserService } from '@/modules/users/service/auth.user.service';

export interface AuthenticatedUser {
  id: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authUserService: AuthUserService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      request.user = { id: this.authUserService.verifyToken(token).sub };
    } catch (error) {
      throw new UnauthorizedException('Invalid access token', {
        cause: error,
      });
    }
    return true;
  }
}

function bearerToken(header: string | undefined): string | undefined {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}
