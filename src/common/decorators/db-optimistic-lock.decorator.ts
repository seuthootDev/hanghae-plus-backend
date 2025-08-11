import { SetMetadata } from '@nestjs/common';

export interface DbOptimisticLockOptions {
  table: string;
  column: string;
  value: string | ((args: any[]) => string);
  versionColumn?: string;
  maxRetries?: number;
  retryDelay?: number;
  errorMessage?: string;
}

export const DB_OPTIMISTIC_LOCK_KEY = 'db_optimistic_lock';
export const DbOptimisticLock = (options: DbOptimisticLockOptions) => 
  SetMetadata(DB_OPTIMISTIC_LOCK_KEY, options); 