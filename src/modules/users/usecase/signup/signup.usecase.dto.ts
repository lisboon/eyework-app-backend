import {
  IsByteLength,
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { BaseUseCase } from '@/modules/@shared/usecase/base.usecase';

export interface SignUpInputDto {
  name: string;
  email: string;
  password: string;
}

export interface SignUpOutputDto {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}

export type SignUpUseCaseInterface = BaseUseCase<
  SignUpInputDto,
  SignUpOutputDto
>;

export class SignUpInput implements SignUpInputDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72, { message: 'password must be at most 72 bytes' })
  password: string;
}
