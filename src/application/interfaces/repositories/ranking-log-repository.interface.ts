import { RankingLog } from '../../../domain/entities/ranking-log.entity';

export interface RankingLogRepositoryInterface {
  save(rankingLog: RankingLog): Promise<RankingLog>;
  findByUserIdAndCouponType(userId: number, couponType: string): Promise<RankingLog[]>;
  findFailedLogs(): Promise<RankingLog[]>;
  updateStatus(id: number, status: 'ISSUED' | 'FAILED'): Promise<void>;
  incrementRetryCount(id: number): Promise<void>;
}

export const RANKING_LOG_REPOSITORY = 'RANKING_LOG_REPOSITORY';
