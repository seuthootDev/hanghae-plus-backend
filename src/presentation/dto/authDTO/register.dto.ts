import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 20자 이하여야 합니다.' })
  password: string;

  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @MaxLength(20, { message: '이름은 20자 이하여야 합니다.' })
  name: string;
} 