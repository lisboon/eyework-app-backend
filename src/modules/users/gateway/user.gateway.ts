import type { User } from '../domain/user.entity';

export interface UserGateway {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}
