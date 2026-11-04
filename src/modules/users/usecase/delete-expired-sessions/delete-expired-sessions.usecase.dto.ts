import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';

export interface DeleteExpiredSessionsOutputDto {
  deleted: number;
}

export type DeleteExpiredSessionsUseCaseInterface = BaseUseCase<
  void,
  DeleteExpiredSessionsOutputDto
>;
