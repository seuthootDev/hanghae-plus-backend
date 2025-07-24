import { User } from '../user.entity';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User(1, 'Test User', 'test@example.com', 1000);
  });

  describe('chargePoints', () => {
    it('포인트를 성공적으로 충전해야 한다', () => {
      const initialPoints = user.points;
      const chargeAmount = 500;

      user.chargePoints(chargeAmount);

      expect(user.points).toBe(initialPoints + chargeAmount);
    });

    it('음수 금액으로 충전하면 에러를 던져야 한다', () => {
      expect(() => {
        user.chargePoints(-100);
      }).toThrow('포인트는 음수일 수 없습니다.');
    });

    it('0원으로 충전하면 에러를 던져야 한다', () => {
      expect(() => {
        user.chargePoints(0);
      }).toThrow('포인트는 음수일 수 없습니다.');
    });
  });

  describe('usePoints', () => {
    it('포인트를 성공적으로 사용해야 한다', () => {
      const initialPoints = user.points;
      const useAmount = 300;

      user.usePoints(useAmount);

      expect(user.points).toBe(initialPoints - useAmount);
    });

    it('잔액보다 많은 포인트를 사용하면 에러를 던져야 한다', () => {
      expect(() => {
        user.usePoints(2000);
      }).toThrow('포인트가 부족합니다.');
    });

    it('음수 금액으로 사용하면 에러를 던져야 한다', () => {
      expect(() => {
        user.usePoints(-100);
      }).toThrow('포인트는 음수일 수 없습니다.');
    });
  });

  describe('hasEnoughPoints', () => {
    it('충분한 포인트가 있을 때 true를 반환해야 한다', () => {
      expect(user.hasEnoughPoints(500)).toBe(true);
    });

    it('부족한 포인트가 있을 때 false를 반환해야 한다', () => {
      expect(user.hasEnoughPoints(2000)).toBe(false);
    });

    it('정확히 같은 포인트가 있을 때 true를 반환해야 한다', () => {
      expect(user.hasEnoughPoints(1000)).toBe(true);
    });
  });

  describe('points getter', () => {
    it('현재 포인트를 반환해야 한다', () => {
      expect(user.points).toBe(1000);
    });
  });
}); 