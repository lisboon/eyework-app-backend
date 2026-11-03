import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';

export interface FindMeInputDto {
  id: string;
}

export interface FindMeOutputDto {
  id: string;
  name: string;
  email: string;
}

export type FindMeUseCaseInterface = BaseUseCase<
  FindMeInputDto,
  FindMeOutputDto
>;
