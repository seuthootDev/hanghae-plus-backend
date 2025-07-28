import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { TransactionInterceptor } from '../../../../src/common/interceptors/transaction.interceptor';
import { TRANSACTIONAL_KEY } from '../../../../src/common/decorators/transactional.decorator';

describe('TransactionInterceptor', () => {
  let interceptor: TransactionInterceptor;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockReflector: jest.Mocked<Reflector>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(async () => {
    const mockDataSourceProvider = {
      provide: DataSource,
      useValue: {
        createQueryRunner: jest.fn(),
      },
    };

    const mockReflectorProvider = {
      provide: Reflector,
      useValue: {
        get: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionInterceptor,
        mockDataSourceProvider,
        mockReflectorProvider,
      ],
    }).compile();

    interceptor = module.get<TransactionInterceptor>(TransactionInterceptor);
    mockDataSource = module.get(DataSource);
    mockReflector = module.get(Reflector);
  });

  beforeEach(() => {
    mockExecutionContext = {
      getHandler: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  describe('intercept', () => {
    it('@Transactional 데코레이터가 없는 경우 트랜잭션 없이 실행되어야 한다', async () => {
      // Arrange
      mockReflector.get.mockReturnValue(false);
      mockCallHandler.handle.mockReturnValue(of('success'));

      // Act
      const result = await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));

      // Assert
      expect(mockReflector.get).toHaveBeenCalledWith(TRANSACTIONAL_KEY, mockExecutionContext.getHandler());
      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('@Transactional 데코레이터가 있는 경우 트랜잭션으로 실행되어야 한다', async () => {
      // Arrange
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      mockReflector.get.mockReturnValue(true);
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner as any);
      mockCallHandler.handle.mockReturnValue(of('success'));

      // Act
      const result = await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));

      // Assert
      expect(mockReflector.get).toHaveBeenCalledWith(TRANSACTIONAL_KEY, mockExecutionContext.getHandler());
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('트랜잭션 중 에러가 발생하면 롤백되어야 한다', async () => {
      // Arrange
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      const error = new Error('Database error');
      mockReflector.get.mockReturnValue(true);
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner as any);
      mockCallHandler.handle.mockReturnValue(of(Promise.reject(error)));

      // Act & Assert
      await expect(firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler))).rejects.toThrow('Database error');
      
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
}); 