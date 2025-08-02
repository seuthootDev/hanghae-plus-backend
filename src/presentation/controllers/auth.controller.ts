import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegisterDto } from '../dto/authDTO/register.dto';
import { LoginDto } from '../dto/authDTO/login.dto';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.registerUseCase.execute(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.loginUseCase.execute(loginDto);
  }
} 