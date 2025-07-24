import { AuthValidationService } from '../../../src/domain/services/auth-validation.service';
import { User } from '../../../src/domain/entities/user.entity';

describe('AuthValidationService', () => {
  let authValidationService: AuthValidationService;

  beforeEach(() => {
    authValidationService = new AuthValidationService();
  });

  describe('validateEmail', () => {
    it('올바른 이메일 형식을 통과해야 한다', () => {
      expect(() => authValidationService.validateEmail('test@example.com')).not.toThrow();
      expect(() => authValidationService.validateEmail('user.name@domain.co.kr')).not.toThrow();
    });

    it('빈 이메일에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateEmail('')).toThrow('이메일은 필수입니다.');
      expect(() => authValidationService.validateEmail('   ')).toThrow('이메일은 필수입니다.');
    });

    it('잘못된 이메일 형식에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateEmail('invalid-email')).toThrow('올바른 이메일 형식이 아닙니다.');
      expect(() => authValidationService.validateEmail('test@')).toThrow('올바른 이메일 형식이 아닙니다.');
      expect(() => authValidationService.validateEmail('@example.com')).toThrow('올바른 이메일 형식이 아닙니다.');
    });
  });

  describe('validatePassword', () => {
    it('올바른 비밀번호를 통과해야 한다', () => {
      expect(() => authValidationService.validatePassword('password123')).not.toThrow();
      expect(() => authValidationService.validatePassword('12345678')).not.toThrow();
    });

    it('8자 미만 비밀번호에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validatePassword('1234567')).toThrow('비밀번호는 8자 이상이어야 합니다.');
      expect(() => authValidationService.validatePassword('')).toThrow('비밀번호는 8자 이상이어야 합니다.');
    });

    it('100자 초과 비밀번호에 대해 에러를 던져야 한다', () => {
      const longPassword = 'a'.repeat(101);
      expect(() => authValidationService.validatePassword(longPassword)).toThrow('비밀번호는 100자 이하여야 합니다.');
    });
  });

  describe('validateName', () => {
    it('올바른 이름을 통과해야 한다', () => {
      expect(() => authValidationService.validateName('홍길동')).not.toThrow();
      expect(() => authValidationService.validateName('John Doe')).not.toThrow();
    });

    it('빈 이름에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateName('')).toThrow('이름은 필수입니다.');
      expect(() => authValidationService.validateName('   ')).toThrow('이름은 필수입니다.');
    });

    it('50자 초과 이름에 대해 에러를 던져야 한다', () => {
      const longName = 'a'.repeat(51);
      expect(() => authValidationService.validateName(longName)).toThrow('이름은 50자 이하여야 합니다.');
    });
  });

  describe('validateRegistration', () => {
    it('올바른 회원가입 데이터를 통과해야 한다', () => {
      expect(() => authValidationService.validateRegistration('test@example.com', 'password123', '홍길동')).not.toThrow();
    });

    it('잘못된 이메일로 회원가입 시 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateRegistration('invalid-email', 'password123', '홍길동'))
        .toThrow('올바른 이메일 형식이 아닙니다.');
    });

    it('잘못된 비밀번호로 회원가입 시 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateRegistration('test@example.com', '123', '홍길동'))
        .toThrow('비밀번호는 8자 이상이어야 합니다.');
    });

    it('잘못된 이름으로 회원가입 시 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateRegistration('test@example.com', 'password123', ''))
        .toThrow('이름은 필수입니다.');
    });
  });

  describe('validateLogin', () => {
    it('올바른 로그인 데이터를 통과해야 한다', () => {
      expect(() => authValidationService.validateLogin('test@example.com', 'password123')).not.toThrow();
    });

    it('잘못된 이메일로 로그인 시 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateLogin('invalid-email', 'password123'))
        .toThrow('올바른 이메일 형식이 아닙니다.');
    });

    it('잘못된 비밀번호로 로그인 시 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateLogin('test@example.com', '123'))
        .toThrow('비밀번호는 8자 이상이어야 합니다.');
    });
  });

  describe('validateUserExists', () => {
    it('존재하는 사용자를 통과해야 한다', () => {
      const user = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
      expect(() => authValidationService.validateUserExists(user)).not.toThrow();
    });

    it('존재하지 않는 사용자에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateUserExists(null)).toThrow('사용자를 찾을 수 없습니다.');
    });
  });

  describe('validatePasswordMatch', () => {
    it('일치하는 비밀번호를 통과해야 한다', () => {
      expect(() => authValidationService.validatePasswordMatch(true)).not.toThrow();
    });

    it('일치하지 않는 비밀번호에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validatePasswordMatch(false)).toThrow('비밀번호가 일치하지 않습니다.');
    });
  });

  describe('validateEmailNotExists', () => {
    it('새로운 이메일을 통과해야 한다', () => {
      expect(() => authValidationService.validateEmailNotExists(null)).not.toThrow();
    });

    it('이미 존재하는 이메일에 대해 에러를 던져야 한다', () => {
      const existingUser = new User(1, '홍길동', 'test@example.com', 1000, 'hashed_password');
      expect(() => authValidationService.validateEmailNotExists(existingUser)).toThrow('이미 사용 중인 이메일입니다.');
    });
  });

  describe('validateToken', () => {
    it('올바른 토큰을 통과해야 한다', () => {
      expect(() => authValidationService.validateToken('valid-token')).not.toThrow();
    });

    it('빈 토큰에 대해 에러를 던져야 한다', () => {
      expect(() => authValidationService.validateToken('')).toThrow('토큰은 필수입니다.');
      expect(() => authValidationService.validateToken('   ')).toThrow('토큰은 필수입니다.');
    });
  });
}); 