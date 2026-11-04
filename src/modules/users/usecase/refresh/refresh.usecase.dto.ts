import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';
import type { Session } from '../../service/session.service';

export interface RefreshInputDto {
  refreshToken: string;
}

export type RefreshOutputDto = Session;

export type RefreshUseCaseInterface = BaseUseCase<
  RefreshInputDto,
  RefreshOutputDto
>;
