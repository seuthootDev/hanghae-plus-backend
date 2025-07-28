import { Injectable, Inject } from '@nestjs/common';
import { AuthServiceInterface, AUTH_SERVICE } from '../../interfaces/services/auth-service.interface';

@Injectable()
export class ValidateTokenUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthServiceInterface
  ) {}

  async execute(token: string): Promise<any> {
    return this.authService.validateToken(token);
  }
} 