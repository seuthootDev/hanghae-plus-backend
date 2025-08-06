import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { PESSIMISTIC_LOCK_KEY, PessimisticLockOptions } from '../decorators/pessimistic-lock.decorator';
import { RedisDistributedLockService } from '../../infrastructure/services/redis-distributed-lock.service';

@Injectable()
export class RedisPessimisticLockInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisDistributedLockService: RedisDistributedLockService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<PessimisticLockOptions>(
      PESSIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return from(this.executeWithRedisPessimisticLock(context, next, options));
  }

  private async executeWithRedisPessimisticLock(
    context: ExecutionContext, 
    next: CallHandler, 
    options: PessimisticLockOptions
  ): Promise<any> {
    const args = context.getArgs();
    const lockKey = typeof options.key === 'function' ? options.key(args) : options.key;
    const timeout = options.timeout || 5000;

    // Redis 락 키에 prefix 추가
    const redisLockKey = `lock:${lockKey}`;

    const lockAcquired = await this.redisDistributedLockService.acquireLock(redisLockKey, {
      ttl: timeout,
      retryCount: 3,
      retryDelay: 100
    });
    
    if (!lockAcquired) {
      throw new BadRequestException(
        options.errorMessage || '리소스가 사용 중입니다. 잠시 후 다시 시도해주세요.'
      );
    }

    try {
      return await next.handle().toPromise();
    } finally {
      // 락 해제 (finally 블록에서 항상 실행)
      await this.redisDistributedLockService.releaseLock(redisLockKey);
    }
  }
} 