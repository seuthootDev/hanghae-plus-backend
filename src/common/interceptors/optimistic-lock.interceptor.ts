import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, retryWhen, delay, take } from 'rxjs/operators';
import { OPTIMISTIC_LOCK_KEY, OptimisticLockOptions } from '../decorators/optimistic-lock.decorator';

@Injectable()
export class OptimisticLockInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<OptimisticLockOptions>(
      OPTIMISTIC_LOCK_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 100;

    return next.handle().pipe(
      catchError(error => {
        // 낙관적 락 충돌 감지 (TypeORM OptimisticLockException)
        if (this.isOptimisticLockException(error)) {
          return throwError(() => new BadRequestException(
            options.errorMessage || '동시 요청으로 인한 충돌이 발생했습니다. 다시 시도해주세요.'
          ));
        }
        return throwError(() => error);
      }),
      retryWhen(errors => 
        errors.pipe(
          delay(retryDelay),
          take(maxRetries)
        )
      )
    );
  }

  private isOptimisticLockException(error: any): boolean {
    // TypeORM OptimisticLockException 또는 버전 충돌 감지
    return error.name === 'OptimisticLockException' || 
           error.message?.includes('optimistic lock') ||
           error.message?.includes('version conflict');
  }
} 