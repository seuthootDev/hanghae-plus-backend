export class AuthResponseDto {
  userId: number;
  email: string;
  name: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
} 