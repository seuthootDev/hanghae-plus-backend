import { User } from '../../../domain/entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRepositoryInterface {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  updatePoints(userId: number, points: number): Promise<User>;
} 