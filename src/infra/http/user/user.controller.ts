import { Body, Controller, Post } from '@nestjs/common';
import {
  SignUpInput,
  type SignUpOutputDto,
} from '@/modules/users/usecase/signup/signup.usecase.dto';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('auth/signup')
  signUp(@Body() body: SignUpInput): Promise<SignUpOutputDto> {
    return this.userService.signUp(body);
  }
}
