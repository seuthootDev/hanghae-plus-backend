import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { PointsResponseDto } from '../../presentation/dto/usersDTO/points-response.dto';
import { UserResponseDto } from '../../presentation/dto/usersDTO/user.dto';
import { UserPresenterInterface } from '../../application/interfaces/presenters/user-presenter.interface';

@Injectable()
export class UserPresenter implements UserPresenterInterface {
  
  presentUserPoints(user: User): PointsResponseDto {
    return {
      userId: user.id,
      balance: user.points
    };
  }

  presentUser(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      point: user.points
    };
  }
} 