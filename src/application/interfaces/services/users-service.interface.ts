import { ChargePointsDto } from '../../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';
import { User } from '../../../domain/entities/user.entity';

export const USERS_SERVICE = 'USERS_SERVICE';

export interface UsersServiceInterface {
  chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<User>;
  getUserPoints(userId: number): Promise<User>;
} 