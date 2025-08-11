import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { DataSource } from 'typeorm';
import { DB_OPTIMISTIC_LOCK_KEY, DbOptimisticLockOptions } from '../decorators/db-optimistic-lock.decorator';

@Injectable()
export class DbOptimisticLockInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<DbOptimisticLockOptions>(
      DB_OPTIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return from(this.executeWithDbOptimisticLock(context, next, options));
  }

  private async executeWithDbOptimisticLock(
    context: ExecutionContext, 
    next: CallHandler, 
    options: DbOptimisticLockOptions
  ): Promise<any> {
    const args = context.getArgs();
    const lockValue = typeof options.value === 'function' ? options.value(args) : options.value;
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 100;

    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // 현재 버전 조회
          const selectQuery = `
            SELECT ${options.versionColumn || 'version'} as version 
            FROM ${options.table} 
            WHERE ${options.column} = ?
          `;
          
          const result = await queryRunner.query(selectQuery, [lockValue]);
          
          if (result.length === 0) {
            throw new Error('레코드를 찾을 수 없습니다.');
          }

          const currentVersion = result[0].version;

          // 원본 메서드 실행
          const methodResult = await next.handle().toPromise();
          
          // 버전 업데이트 확인
          const updateQuery = `
            UPDATE ${options.table} 
            SET ${options.versionColumn || 'version'} = ${options.versionColumn || 'version'} + 1
            WHERE ${options.column} = ? AND ${options.versionColumn || 'version'} = ?
          `;
          
          const updateResult = await queryRunner.query(updateQuery, [lockValue, currentVersion]);
          
          if (updateResult.affectedRows === 0) {
            throw new Error('낙관적 락 충돌');
          }

          // 트랜잭션 커밋
          await queryRunner.commitTransaction();
          
          return methodResult;
        } catch (error) {
          // 트랜잭션 롤백
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          // 쿼리 러너 해제
          await queryRunner.release();
        }
      } catch (error) {
        lastError = error;
        
        if (error.message === '낙관적 락 충돌' && attempt < maxRetries - 1) {
          // 재시도 전 대기
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        break;
      }
    }

    // 모든 재시도 실패
    throw new BadRequestException(
      options.errorMessage || '데이터가 다른 사용자에 의해 수정되었습니다. 다시 시도해주세요.'
    );
  }
} 