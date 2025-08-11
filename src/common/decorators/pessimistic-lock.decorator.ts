import { SetMetadata } from '@nestjs/common';

export interface PessimisticLockOptions {
  key: string | ((args: any[]) => string);
  timeout?: number;
  errorMessage?: string;
}

export const PESSIMISTIC_LOCK_KEY = 'pessimistic_lock';
export const PessimisticLock = (options: PessimisticLockOptions) => 
  SetMetadata(PESSIMISTIC_LOCK_KEY, options); 