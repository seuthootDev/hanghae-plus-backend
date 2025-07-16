import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  // 사용자 관련 기본 기능들 (현재는 비어있음)
} 