import { SetMetadata } from '@nestjs/common';

export interface OptimisticLockOptions {
  key: string | ((args: any[]) => string);
  maxRetries?: number;
  retryDelay?: number;
  errorMessage?: string;
}

export const OPTIMISTIC_LOCK_KEY = 'optimistic_lock';
export const OptimisticLock = (options: OptimisticLockOptions) => 
  SetMetadata(OPTIMISTIC_LOCK_KEY, options); 