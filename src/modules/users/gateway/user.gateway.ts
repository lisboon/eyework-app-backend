import type { User } from '../domain/user.entity';

export interface UserGateway {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}
