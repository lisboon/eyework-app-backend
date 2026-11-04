import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';

export class RefreshTokenReuseError extends UnauthorizedError {
  constructor(
    readonly userId: string,
    readonly familyId: string,
  ) {
    super('Invalid refresh token');
    this.name = 'RefreshTokenReuseError';
  }
}
