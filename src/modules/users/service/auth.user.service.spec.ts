import bcrypt from 'bcryptjs';
import { AuthUserService } from './auth.user.service';

describe('AuthUserService', () => {
  it('should hash the password with bcrypt cost 10', async () => {
    const service = new AuthUserService();

    const hash = await service.hashPassword('correct-horse-battery');

    expect(hash).not.toBe('correct-horse-battery');
    expect(bcrypt.getRounds(hash)).toBe(10);
    await expect(bcrypt.compare('correct-horse-battery', hash)).resolves.toBe(
      true,
    );
  });
});
