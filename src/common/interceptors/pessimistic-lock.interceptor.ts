import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { PESSIMISTIC_LOCK_KEY, PessimisticLockOptions } from '../decorators/pessimistic-lock.decorator';
import { RedisDistributedLockServiceInterface, REDIS_DISTRIBUTED_LOCK_SERVICE } from '../../application/interfaces/services/redis-distributed-lock-service.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class PessimisticLockInterceptor implements NestInterceptor {
  private locks = new Map<string, boolean>();

  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_DISTRIBUTED_LOCK_SERVICE)
    private readonly redisDistributedLockService: RedisDistributedLockServiceInterface,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<PessimisticLockOptions>(
      PESSIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return from(this.executeWithPessimisticLockAndRedisLock(context, next, options));
  }

  private async executeWithPessimisticLockAndRedisLock(
    context: ExecutionContext, 
    next: CallHandler, 
    options: PessimisticLockOptions
  ): Promise<any> {
    // 1. Redis 분산락 획득 (먼저)
    const redisLockKey = `global:${this.generateLockKey(context, options)}`;
    const redisLockAcquired = await this.redisDistributedLockService.acquireLock(redisLockKey, {
      ttl: options.timeout || 5000,
      retryCount: 3,
      retryDelay: 100
    });

    if (!redisLockAcquired) {
      throw new BadRequestException(
        options.errorMessage || '리소스가 사용 중입니다. 잠시 후 다시 시도해주세요.'
      );
    }

    try {
      // 2. 비관적 락 처리 (기존 로직)
      const lockKey = this.generateLockKey(context, options);
      const timeout = options.timeout || 5000;

      const lock = await this.acquirePessimisticLock(lockKey, timeout);
      
      if (!lock) {
        throw new BadRequestException(
          options.errorMessage || '리소스가 사용 중입니다. 잠시 후 다시 시도해주세요.'
        );
      }

      try {
        return await next.handle().toPromise();
      } finally {
        await this.releasePessimisticLock(lockKey);
      }
    } finally {
      // 3. Redis 락 해제
      await this.redisDistributedLockService.releaseLock(redisLockKey);
    }
  }

  private generateLockKey(context: ExecutionContext, options: PessimisticLockOptions): string {
    const args = context.getArgs();
    if (typeof options.key === 'function') {
      return options.key(args);
    }
    return options.key;
  }

  private async acquirePessimisticLock(key: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (!this.locks.has(key)) {
        this.locks.set(key, true);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return false;
  }

  private async releasePessimisticLock(key: string): Promise<void> {
    this.locks.delete(key);
  }
} 