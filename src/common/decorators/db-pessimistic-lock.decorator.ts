import { SetMetadata } from '@nestjs/common';

export interface DbPessimisticLockOptions {
  table: string;
  column: string;
  value: string | ((args: any[]) => string);
  lockMode?: 'FOR UPDATE' | 'FOR SHARE';
  timeout?: number;
  errorMessage?: string;
}

export const DB_PESSIMISTIC_LOCK_KEY = 'db_pessimistic_lock';
export const DbPessimisticLock = (options: DbPessimisticLockOptions) => 
  SetMetadata(DB_PESSIMISTIC_LOCK_KEY, options); 