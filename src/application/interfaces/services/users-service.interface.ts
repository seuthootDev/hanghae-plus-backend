import { ChargePointsDto } from '../../../presentation/dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../../../presentation/dto/usersDTO/points-response.dto';

export const USERS_SERVICE = 'USERS_SERVICE';

export interface UsersServiceInterface {
  chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto>;
  getUserPoints(userId: number): Promise<PointsResponseDto>;
} 