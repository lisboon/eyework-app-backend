import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth-guard';
import { currentUser } from './current-user.decorator';

describe('currentUser', () => {
  const makeContext = (request: Partial<AuthenticatedRequest>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  it('should return the user attached by AuthGuard', () => {
    const context = makeContext({ user: { id: 'user-1' } });

    expect(currentUser(undefined, context)).toEqual({ id: 'user-1' });
  });

  it('should fail loudly when the route has no AuthGuard', () => {
    const context = makeContext({});

    expect(() => currentUser(undefined, context)).toThrow(
      'CurrentUser requires AuthGuard on the route',
    );
  });
});
