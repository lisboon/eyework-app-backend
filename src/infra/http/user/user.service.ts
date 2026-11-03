import { Injectable } from '@nestjs/common';
import { UserFacade } from '@/modules/users/facade/user.facade';
import type {
  FindMeInputDto,
  FindMeOutputDto,
} from '@/modules/users/usecase/find-me/find-me.usecase.dto';
import type {
  LoginInputDto,
  LoginOutputDto,
} from '@/modules/users/usecase/login/login.usecase.dto';
import type {
  SignUpInputDto,
  SignUpOutputDto,
} from '@/modules/users/usecase/signup/signup.usecase.dto';

@Injectable()
export class UserService {
  constructor(private readonly userFacade: UserFacade) {}

  signUp(input: SignUpInputDto): Promise<SignUpOutputDto> {
    return this.userFacade.signUp(input);
  }

  login(input: LoginInputDto): Promise<LoginOutputDto> {
    return this.userFacade.login(input);
  }

  findMe(input: FindMeInputDto): Promise<FindMeOutputDto> {
    return this.userFacade.findMe(input);
  }
}
