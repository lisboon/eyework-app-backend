import { Injectable } from '@nestjs/common';
import { UserFacade } from '@/modules/users/facade/user.facade';
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
}
