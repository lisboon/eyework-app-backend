import type {
  PrismaClient,
  RefreshToken as RefreshTokenModel,
} from '@/infra/database/generated/prisma/client';
import { RefreshToken } from '../domain/refresh-token.entity';
import type { RefreshTokenGateway } from '../gateway/refresh-token.gateway';

export class RefreshTokenRepository implements RefreshTokenGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        familyId: token.familyId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        revokedAt: token.revokedAt,
        createdAt: token.createdAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
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
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toEntity(row: RefreshTokenModel): RefreshToken {
    return new RefreshToken({
      id: row.id,
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? undefined,
      createdAt: row.createdAt,
    });
  }
}
