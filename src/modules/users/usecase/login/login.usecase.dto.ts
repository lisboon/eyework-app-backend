import { IsByteLength, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';

export interface LoginInputDto {
  email: string;
  password: string;
}

export interface LoginOutputDto {
  accessToken: string;
}

export type LoginUseCaseInterface = BaseUseCase<LoginInputDto, LoginOutputDto>;

export class LoginInput implements LoginInputDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsByteLength(0, 72, { message: 'password must be at most 72 bytes' })
  password: string;
}
