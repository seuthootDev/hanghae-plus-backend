import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingLogRepositoryInterface, RANKING_LOG_REPOSITORY } from '../../application/interfaces/repositories/ranking-log-repository.interface';
import { RankingLog } from '../../domain/entities/ranking-log.entity';
import { RankingLogEntity } from './typeorm/ranking-log.entity';

@Injectable()
export class RankingLogRepository implements RankingLogRepositoryInterface {
  constructor(
    @InjectRepository(RankingLogEntity)
    private readonly rankingLogRepository: Repository<RankingLogEntity>
  ) {}

  async save(rankingLog: RankingLog): Promise<RankingLog> {
    const entity = new RankingLogEntity();
    entity.userId = rankingLog.userId;
    entity.couponType = rankingLog.couponType;
    entity.rank = rankingLog.rank;
    entity.timestamp = rankingLog.timestamp;
    entity.status = rankingLog.status;
    entity.retryCount = rankingLog.retryCount;

    const savedEntity = await this.rankingLogRepository.save(entity);
    
    return new RankingLog(
      savedEntity.id,
      savedEntity.userId,
      savedEntity.couponType,
      savedEntity.rank,
      savedEntity.timestamp,
      savedEntity.status,
      savedEntity.retryCount
    );
  }

  async findByUserIdAndCouponType(userId: number, couponType: string): Promise<RankingLog[]> {
    const entities = await this.rankingLogRepository.find({
      where: { userId, couponType },
      order: { timestamp: 'DESC' }
    });

    return entities.map(entity => new RankingLog(
      entity.id,
      entity.userId,
      entity.couponType,
      entity.rank,
      entity.timestamp,
      entity.status,
      entity.retryCount
    ));
  }

  async findFailedLogs(): Promise<RankingLog[]> {
    const entities = await this.rankingLogRepository.find({
      where: { status: 'FAILED' },
      order: { timestamp: 'ASC' }
    });

    return entities.map(entity => new RankingLog(
      entity.id,
      entity.userId,
      entity.couponType,
      entity.rank,
      entity.timestamp,
      entity.status,
      entity.retryCount
    ));
  }

  async updateStatus(id: number, status: 'ISSUED' | 'FAILED'): Promise<void> {
    await this.rankingLogRepository.update(id, { status });
  }

  async incrementRetryCount(id: number): Promise<void> {
    await this.rankingLogRepository.increment({ id }, 'retryCount', 1);
  }
}
