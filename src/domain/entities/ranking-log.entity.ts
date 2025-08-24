export class RankingLog {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly couponType: string,
    public readonly rank: number,
    public readonly timestamp: Date,
    public readonly status: 'ISSUED' | 'FAILED' = 'ISSUED',
    public readonly retryCount: number = 0
  ) {}

  static create(
    userId: number,
    couponType: string,
    rank: number
  ): RankingLog {
    return new RankingLog(
      0, // ID는 DB에서 자동 생성
      userId,
      couponType,
      rank,
      new Date(),
      'ISSUED',
      0
    );
  }

  markAsFailed(): RankingLog {
    return new RankingLog(
      this.id,
      this.userId,
      this.couponType,
      this.rank,
      this.timestamp,
      'FAILED',
      this.retryCount
    );
  }

  incrementRetryCount(): RankingLog {
    return new RankingLog(
      this.id,
      this.userId,
      this.couponType,
      this.rank,
      this.timestamp,
      this.status,
      this.retryCount + 1
    );
  }
}
