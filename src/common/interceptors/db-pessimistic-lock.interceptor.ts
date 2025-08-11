import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { DataSource } from 'typeorm';
import { DB_PESSIMISTIC_LOCK_KEY, DbPessimisticLockOptions } from '../decorators/db-pessimistic-lock.decorator';

@Injectable()
export class DbPessimisticLockInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<DbPessimisticLockOptions>(
      DB_PESSIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return from(this.executeWithDbPessimisticLock(context, next, options));
  }

  private async executeWithDbPessimisticLock(
    context: ExecutionContext, 
    next: CallHandler, 
    options: DbPessimisticLockOptions
  ): Promise<any> {
    const args = context.getArgs();
    const lockValue = typeof options.value === 'function' ? options.value(args) : options.value;
    const lockMode = options.lockMode || 'FOR UPDATE';
    const timeout = options.timeout || 5000;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // DB 물리적 락 획득
      const lockQuery = `
        SELECT * FROM ${options.table} 
        WHERE ${options.column} = ? 
        ${lockMode}
      `;
      
      await queryRunner.query(lockQuery, [lockValue]);

      // 원본 메서드 실행
      const result = await next.handle().toPromise();
      
      // 트랜잭션 커밋
      await queryRunner.commitTransaction();
      
      return result;
    } catch (error) {
      // 트랜잭션 롤백
      await queryRunner.rollbackTransaction();
      
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
        throw new BadRequestException(
          options.errorMessage || '리소스가 사용 중입니다. 잠시 후 다시 시도해주세요.'
        );
      }
      
      throw error;
    } finally {
      // 쿼리 러너 해제
      await queryRunner.release();
    }
  }
} 