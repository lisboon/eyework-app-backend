import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../auth/auth-guard';

export function currentUser(
  _data: unknown,
  context: ExecutionContext,
): AuthenticatedUser {
  const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!user) {
    throw new Error('CurrentUser requires AuthGuard on the route');
  }
  return user;
}

export const CurrentUser = createParamDecorator(currentUser);
