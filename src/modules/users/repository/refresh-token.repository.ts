import type {
  PrismaClient,
  RefreshTokenFamily as RefreshTokenFamilyModel,
  RefreshToken as RefreshTokenModel,
} from '@/infra/database/generated/prisma/client';
import { resolvePrismaClient } from '@/infra/database/prisma-transaction.context';
import type { TransactionContext } from '@/modules/@shared/domain/transaction/transaction-manager.interface';
import { RefreshToken } from '../domain/refresh-token.entity';
import type { RefreshTokenGateway } from '../gateway/refresh-token.gateway';

type RefreshTokenRow = RefreshTokenModel & { family: RefreshTokenFamilyModel };

export class RefreshTokenRepository implements RefreshTokenGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: RefreshToken, trx?: TransactionContext): Promise<void> {
    await resolvePrismaClient(this.prisma, trx).refreshToken.create({
      data: {
        id: token.id,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
        family: {
          connectOrCreate: {
            where: { id: token.familyId },
            create: {
              id: token.familyId,
              userId: token.userId,
              createdAt: token.createdAt,
            },
          },
        },
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { family: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async revoke(id: string): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count === 1;
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshTokenFamily.updateMany({
      where: { id: familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toEntity(row: RefreshTokenRow): RefreshToken {
    return new RefreshToken({
      id: row.id,
      userId: row.family.userId,
      familyId: row.familyId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? undefined,
      familyRevokedAt: row.family.revokedAt ?? undefined,
      createdAt: row.createdAt,
    });
  }
}
