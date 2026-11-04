import type {
  DeleteExpiredSessionsOutputDto,
  DeleteExpiredSessionsUseCaseInterface,
} from '../usecase/delete-expired-sessions/delete-expired-sessions.usecase.dto';
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
  LogoutInputDto,
  LogoutUseCaseInterface,
} from '../usecase/logout/logout.usecase.dto';
import type {
  RefreshInputDto,
  RefreshOutputDto,
  RefreshUseCaseInterface,
} from '../usecase/refresh/refresh.usecase.dto';
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
    private readonly refreshUseCase: RefreshUseCaseInterface,
    private readonly logoutUseCase: LogoutUseCaseInterface,
    private readonly deleteExpiredSessionsUseCase: DeleteExpiredSessionsUseCaseInterface,
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

  refresh(input: RefreshInputDto): Promise<RefreshOutputDto> {
    return this.refreshUseCase.execute(input);
  }

  logout(input: LogoutInputDto): Promise<void> {
    return this.logoutUseCase.execute(input);
  }

  deleteExpiredSessions(): Promise<DeleteExpiredSessionsOutputDto> {
    return this.deleteExpiredSessionsUseCase.execute();
  }
}
