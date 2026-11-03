import type {
  FindMeInputDto,
  FindMeOutputDto,
  FindMeUseCaseInterface,
} from '../usecase/find-me/find-me.usecase.dto';
import type {
  LoginInputDto,
  LoginOutputDto,
  LoginUseCaseInterface,
} from '../usecase/login/login.usecase.dto';
import type {
  SignUpInputDto,
  SignUpOutputDto,
  SignUpUseCaseInterface,
} from '../usecase/signup/signup.usecase.dto';

export class UserFacade {
  constructor(
    private readonly signUpUseCase: SignUpUseCaseInterface,
    private readonly loginUseCase: LoginUseCaseInterface,
    private readonly findMeUseCase: FindMeUseCaseInterface,
  ) {}

  signUp(input: SignUpInputDto): Promise<SignUpOutputDto> {
    return this.signUpUseCase.execute(input);
  }

  login(input: LoginInputDto): Promise<LoginOutputDto> {
    return this.loginUseCase.execute(input);
  }

  findMe(input: FindMeInputDto): Promise<FindMeOutputDto> {
    return this.findMeUseCase.execute(input);
  }
}
