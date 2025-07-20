import { Injectable, BadRequestException } from '@nestjs/common';
import { ChargePointsDto } from './dto/charge-points.dto';
import { PointsResponseDto } from './dto/points-response.dto';

@Injectable()
export class UsersService {
  
  async chargePoints(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto> {
    // Mock 비즈니스 로직: 포인트 충전
    const { amount } = chargePointsDto;
    
    // 정책 검증 (최소, 최대 금액)
    if (amount < 1000 || amount > 1000000) {
      throw new BadRequestException('포인트 충전 금액은 1,000원 ~ 1,000,000원 사이여야 합니다.');
    }
    
    // Mock 데이터: 기존 잔액 5000원 + 충전 금액
    const currentBalance = 5000;
    const newBalance = currentBalance + amount;
    
    return {
      userId,
      balance: newBalance
    };
  }

  async getUserPoints(userId: number): Promise<PointsResponseDto> {
    // Mock 비즈니스 로직: 포인트 조회
    // Mock 데이터: 사용자별 포인트 잔액
    const mockPoints = {
      1: 15000,
      2: 25000,
      3: 8000
    };
    
    const balance = mockPoints[userId] || 0;
    
    return {
      userId,
      balance
    };
  }
} 