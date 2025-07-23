import { User } from '../../../domain/entities/user.entity';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { UserResponseDto } from '../../../presentation/dto/usersDTO/user.dto';

export const USER_PRESENTER = 'USER_PRESENTER';

export interface UserPresenterInterface {
  presentUserPoints(user: User): PointsResponseDto;
  presentUser(user: User): UserResponseDto;
} 