import type {
  SignUpInputDto,
  SignUpOutputDto,
  SignUpUseCaseInterface,
} from '../usecase/signup/signup.usecase.dto';

export class UserFacade {
  constructor(private readonly signUpUseCase: SignUpUseCaseInterface) {}

  signUp(input: SignUpInputDto): Promise<SignUpOutputDto> {
    return this.signUpUseCase.execute(input);
  }
}
