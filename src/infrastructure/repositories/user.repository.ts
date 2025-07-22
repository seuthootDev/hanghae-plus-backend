import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../application/interfaces/repositories/user-repository.interface';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
  private users: Map<number, User> = new Map();

  constructor() {
    // Mock 데이터 초기화
    this.users.set(1, new User(1, '김철수', 'kim@example.com', 15000));
    this.users.set(2, new User(2, '이영희', 'lee@example.com', 25000));
    this.users.set(3, new User(3, '박민수', 'park@example.com', 8000));
  }

  async findById(id: number): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async updatePoints(userId: number, points: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // 포인트 업데이트
    user.chargePoints(points - user.points); // 차이값만큼 충전
    this.users.set(userId, user);
    return user;
  }
} 