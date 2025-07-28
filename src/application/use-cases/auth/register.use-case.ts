import { Injectable, Inject } from '@nestjs/common';
import { RegisterDto } from '../../../presentation/dto/authDTO/register.dto';
import { AuthResponseDto } from '../../../presentation/dto/authDTO/auth-response.dto';
import { AuthServiceInterface, AUTH_SERVICE } from '../../interfaces/services/auth-service.interface';
import { AuthPresenterInterface, AUTH_PRESENTER } from '../../interfaces/presenters/auth-presenter.interface';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthServiceInterface,
    @Inject(AUTH_PRESENTER)
    private readonly authPresenter: AuthPresenterInterface
  ) {}

  async execute(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;
    const authResult = await this.authService.register(email, password, name);
    return this.authPresenter.presentAuth(authResult);
  }
} 