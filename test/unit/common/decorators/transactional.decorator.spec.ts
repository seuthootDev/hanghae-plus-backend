import { SetMetadata } from '@nestjs/common';
import { Transactional, TRANSACTIONAL_KEY } from '../../../../src/common/decorators/transactional.decorator';

describe('Transactional Decorator', () => {
  it('메타데이터를 올바르게 설정해야 한다', () => {
    // Arrange
    class TestClass {
      @Transactional()
      testMethod() {
        return 'test';
      }
    }

    // Act
    const testInstance = new TestClass();
    const metadata = Reflect.getMetadata(TRANSACTIONAL_KEY, testInstance.testMethod);

    // Assert
    expect(metadata).toBe(true);
  });

  it('데코레이터가 없는 메서드는 메타데이터가 없어야 한다', () => {
    // Arrange
    class TestClass {
      testMethod() {
        return 'test';
      }
    }

    // Act
    const testInstance = new TestClass();
    const metadata = Reflect.getMetadata(TRANSACTIONAL_KEY, testInstance.testMethod);

    // Assert
    expect(metadata).toBeUndefined();
  });

  it('TRANSACTIONAL_KEY 상수가 올바른 값을 가져야 한다', () => {
    // Assert
    expect(TRANSACTIONAL_KEY).toBe('transactional');
  });
}); 