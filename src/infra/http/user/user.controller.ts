import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { FindMeOutputDto } from '@/modules/users/usecase/find-me/find-me.usecase.dto';
import {
  LoginInput,
  type LoginOutputDto,
} from '@/modules/users/usecase/login/login.usecase.dto';
import {
  SignUpInput,
  type SignUpOutputDto,
} from '@/modules/users/usecase/signup/signup.usecase.dto';
import { AuthGuard, type AuthenticatedUser } from '../auth/auth-guard';
import { CurrentUser } from '../shared/current-user.decorator';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('auth/signup')
  signUp(@Body() body: SignUpInput): Promise<SignUpOutputDto> {
    return this.userService.signUp(body);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginInput): Promise<LoginOutputDto> {
    return this.userService.login(body);
  }

  @Get('users/me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<FindMeOutputDto> {
    return this.userService.findMe({ id: user.id });
  }
}
