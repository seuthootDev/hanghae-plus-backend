import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { PESSIMISTIC_LOCK_KEY, PessimisticLockOptions } from '../decorators/pessimistic-lock.decorator';

@Injectable()
export class PessimisticLockInterceptor implements NestInterceptor {
  private locks = new Map<string, boolean>();

  constructor(
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<PessimisticLockOptions>(
      PESSIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    return from(this.executeWithPessimisticLock(context, next, options));
  }

  private async executeWithPessimisticLock(
    context: ExecutionContext, 
    next: CallHandler, 
    options: PessimisticLockOptions
  ): Promise<any> {
    const args = context.getArgs();
    const lockKey = typeof options.key === 'function' ? options.key(args) : options.key;
    const timeout = options.timeout || 5000;

    // 비관적 락 획득 시도
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
  }

  private async acquirePessimisticLock(key: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (!this.locks.has(key)) {
        this.locks.set(key, true);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms 대기
    }
    
    return false; // 타임아웃
  }

  private async releasePessimisticLock(key: string): Promise<void> {
    this.locks.delete(key);
  }
} 