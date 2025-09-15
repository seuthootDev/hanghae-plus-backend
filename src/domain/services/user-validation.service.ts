import { User } from '../entities/user.entity';

export const USER_VALIDATION_SERVICE = 'USER_VALIDATION_SERVICE';

export class UserValidationService {
  
  /**
   * 포인트 충전 금액 검증
   */
  validateChargeAmount(amount: number): void {
    if (amount < 1000) {
      throw new Error('포인트 충전 금액은 최소 1,000원 이상이어야 합니다.');
    }
    
    if (amount > 1000000) {
      throw new Error('포인트 충전 금액은 최대 1,000,000원을 초과할 수 없습니다.');
    }
  }

  /**
   * 포인트 사용 금액 검증
   */
  validateUseAmount(amount: number): void {
    if (amount < 1000) {
      throw new Error('포인트 사용 금액은 최소 1,000원 이상이어야 합니다.');
    }
  }

  /**
   * 사용자 존재 여부 검증
   */
  validateUserExists(user: User | null): void {
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
  }

  /**
   * 사용자 포인트 잔액 검증
   */
  validateUserPoints(user: User, amount: number): void {
    if (!user.hasEnoughPoints(amount)) {
      throw new Error('포인트가 부족합니다.');
    }
  }

  /**
   * 포인트 충전 전체 검증
   */
  validateChargePoints(user: User | null, amount: number): void {
    this.validateUserExists(user);
    this.validateChargeAmount(amount);
  }

  /**
   * 포인트 사용 전체 검증
   */
  validateUsePoints(user: User | null, amount: number): void {
    this.validateUserExists(user);
    this.validateUseAmount(amount);
    this.validateUserPoints(user!, amount);
  }
} 