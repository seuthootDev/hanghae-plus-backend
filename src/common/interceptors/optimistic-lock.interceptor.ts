import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, retryWhen, delay, take } from 'rxjs/operators';
import { OPTIMISTIC_LOCK_KEY, OptimisticLockOptions } from '../decorators/optimistic-lock.decorator';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../application/interfaces/services/redis-distributed-lock-service.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class OptimisticLockInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_DISTRIBUTED_LOCK_SERVICE)
    private readonly redisDistributedLockService: RedisDistributedLockServiceInterface,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<OptimisticLockOptions>(
      OPTIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return from(this.executeWithOptimisticLockAndRedisLock(context, next, options));
  }

  private async executeWithOptimisticLockAndRedisLock(
    context: ExecutionContext, 
    next: CallHandler, 
    options: OptimisticLockOptions
  ): Promise<any> {
    // 1. Redis 분산락 획득 (먼저)
    const redisLockKey = `global:${this.generateLockKey(context, options)}`;
    const redisLockAcquired = await this.redisDistributedLockService.acquireLock(redisLockKey, {
      ttl: 10000,
      retryCount: 3,
      retryDelay: 100
    });

    if (!redisLockAcquired) {
      throw new BadRequestException('리소스가 사용 중입니다. 잠시 후 다시 시도해주세요.');
    }

    try {
      // 2. 낙관적 락 처리 (기존 로직)
      const maxRetries = options.maxRetries || 3;
      const retryDelay = options.retryDelay || 100;

      let lastError: any;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await next.handle().toPromise();
          return result;
        } catch (error) {
          lastError = error;
          
          if (this.isOptimisticLockException(error) && attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          
          break;
        }
      }

      throw new BadRequestException(
        options.errorMessage || '동시 요청으로 인한 충돌이 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      // 3. Redis 락 해제
      await this.redisDistributedLockService.releaseLock(redisLockKey);
    }
  }

  private generateLockKey(context: ExecutionContext, options: OptimisticLockOptions): string {
    const args = context.getArgs();
    if (typeof options.key === 'function') {
      return options.key(args);
    }
    return options.key;
  }

  private isOptimisticLockException(error: any): boolean {
    return error.name === 'OptimisticLockException' || 
           error.message?.includes('optimistic lock') ||
           error.message?.includes('version conflict');
  }
} 