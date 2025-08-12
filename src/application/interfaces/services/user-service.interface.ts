import { ChargePointsDto } from '../../../presentation/dto/usersDTO/charge-points.dto';
import { User } from '../../../domain/entities/user.entity';

export const USERS_SERVICE = 'USERS_SERVICE';

export interface UsersServiceInterface {
  chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<User>;
  getUserPoints(userId: number): Promise<User>;
  validateUser(userId: number): Promise<User>;
  usePoints(userId: number, amount: number): Promise<User>;
  findById(userId: number): Promise<User | null>;
  save(user: User): Promise<User>;
} 