import type {
  PrismaClient,
  User as UserModel,
} from '@/infra/database/generated/prisma/client';
import { translateUniqueViolation } from '@/infra/database/prisma-errors';
import { resolvePrismaClient } from '@/infra/database/prisma-transaction.context';
import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { User } from '../domain/user.entity';
import { emailAlreadyRegisteredError } from '../domain/user.errors';
import type { UserGateway } from '../gateway/user.gateway';

export class UserRepository implements UserGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async create(user: User, trx?: TransactionContext): Promise<void> {
    const client = resolvePrismaClient(this.prisma, trx);
    await translateUniqueViolation(
      () =>
        client.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            active: user.active,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
          },
        }),
      'User_email_key',
      emailAlreadyRegisteredError,
    );
  }

  private toEntity(row: UserModel): User {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    });
  }
}
