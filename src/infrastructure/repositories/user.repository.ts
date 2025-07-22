import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../application/interfaces/repositories/user-repository.interface';
import { UserEntity } from './typeorm/user.entity';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findById(id: number): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    if (!userEntity) {
      return null;
    }
    
    return new User(
      userEntity.id,
      userEntity.name,
      userEntity.email,
      userEntity.points
    );
  }

  async save(user: User): Promise<User> {
    let userEntity: UserEntity;
    
    if (user.id) {
      // 기존 사용자 업데이트
      userEntity = await this.userRepository.findOne({ where: { id: user.id } });
      if (!userEntity) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      userEntity.points = user.points;
    } else {
      // 새 사용자 생성
      userEntity = this.userRepository.create({
        name: user.name,
        email: user.email,
        points: user.points
      });
    }
    
    const savedEntity = await this.userRepository.save(userEntity);
    
    return new User(
      savedEntity.id,
      savedEntity.name,
      savedEntity.email,
      savedEntity.points
    );
  }

  async updatePoints(userId: number, points: number): Promise<User> {
    const userEntity = await this.userRepository.findOne({ where: { id: userId } });
    if (!userEntity) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    userEntity.points = points;
    const savedEntity = await this.userRepository.save(userEntity);
    
    return new User(
      savedEntity.id,
      savedEntity.name,
      savedEntity.email,
      savedEntity.points
    );
  }
} 