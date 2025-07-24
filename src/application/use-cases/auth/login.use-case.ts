import { Injectable, Inject } from '@nestjs/common';
import { LoginDto } from '../../../presentation/dto/authDTO/login.dto';
import { AuthServiceInterface, AUTH_SERVICE } from '../../interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../interfaces/presenters/auth-presenter.interface';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthServiceInterface,
    @Inject(AUTH_PRESENTER)
    private readonly authPresenter: AuthPresenterInterface
  ) {}

  async execute(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const authResult = await this.authService.login(email, password);
    return this.authPresenter.presentAuth(authResult);
  }
} 