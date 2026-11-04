import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';

export interface LogoutInputDto {
  refreshToken: string;
}

export type LogoutUseCaseInterface = BaseUseCase<LogoutInputDto, void>;
