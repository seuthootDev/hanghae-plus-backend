import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../application/interfaces/repositories/user-repository.interface';
import { UserEntity } from './typeorm/user.entity';
import { DbOptimisticLock } from '../../common/decorators/db-optimistic-lock.decorator';

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
      userEntity.points,
      userEntity.password
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { email } });
    if (!userEntity) {
      return null;
    }
    
    return new User(
      userEntity.id,
      userEntity.name,
      userEntity.email,
      userEntity.points,
      userEntity.password
    );
  }

  @DbOptimisticLock({
    table: 'users',
    column: 'id',
    value: (args: any[]) => args[0].id?.toString() || '0',
    versionColumn: 'version',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '사용자 정보가 다른 사용자에 의해 수정되었습니다. 다시 시도해주세요.'
  })
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
        password: user.password,
        points: user.points
      });
    }
    
    const savedEntity = await this.userRepository.save(userEntity);
    
    return new User(
      savedEntity.id,
      savedEntity.name,
      savedEntity.email,
      savedEntity.points,
      savedEntity.password
    );
  }

} 