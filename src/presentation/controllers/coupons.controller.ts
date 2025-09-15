import { Controller, Post, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IssueCouponDto } from '../dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../dto/couponsDTO/coupon-response.dto';
import { IssueCouponUseCase } from '../../application/use-cases/coupons/issue-coupon.use-case';
import { IssueCouponAsyncUseCase } from '../../application/use-cases/coupons/issue-coupon-async.use-case';
import { GetUserCouponsUseCase } from '../../application/use-cases/coupons/get-user-coupons.use-case';
import { GetCouponIssueStatusUseCase } from '../../application/use-cases/coupons/get-coupon-issue-status.use-case';
import { AsyncCouponIssueResponseDto } from '../dto/couponsDTO/async-coupon-issue-response.dto';
import { CouponIssueStatusDto } from '../dto/couponsDTO/coupon-issue-status.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../application/interfaces/services/coupon-service.interface';
import { Inject } from '@nestjs/common';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {

  constructor(
    private readonly issueCouponUseCase: IssueCouponUseCase,
    private readonly issueCouponAsyncUseCase: IssueCouponAsyncUseCase,
    private readonly getUserCouponsUseCase: GetUserCouponsUseCase,
    private readonly getCouponIssueStatusUseCase: GetCouponIssueStatusUseCase,
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  @Post('issue')
  @ApiOperation({ summary: '쿠폰 발급 (동기식)' })
  @ApiResponse({ 
    status: 201, 
    description: '쿠폰 발급 성공',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 400, description: '쿠폰 소진' })
  async issueCoupon(@Body() issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    return this.issueCouponUseCase.execute(issueCouponDto);
  }

  @Post('issue-async')
  @ApiOperation({ summary: '쿠폰 발급 (비동기식 - 카프카 기반)' })
  @ApiResponse({ 
    status: 202, 
    description: '쿠폰 발급 요청 접수',
    type: AsyncCouponIssueResponseDto 
  })
  async issueCouponAsync(@Body() issueCouponDto: IssueCouponDto): Promise<AsyncCouponIssueResponseDto> {
    return this.issueCouponAsyncUseCase.execute(issueCouponDto);
  }

  @Get('issue-status/:requestId')
  @ApiOperation({ summary: '쿠폰 발급 상태 조회' })
  @ApiParam({ name: 'requestId', description: '요청 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '쿠폰 발급 상태 조회 성공',
    type: CouponIssueStatusDto
  })
  async getCouponIssueStatus(@Param('requestId') requestId: string): Promise<CouponIssueStatusDto | null> {
    return this.getCouponIssueStatusUseCase.execute(requestId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '보유 쿠폰 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '보유 쿠폰 조회 성공',
    type: [CouponResponseDto]
  })
  async getUserCoupons(@Param('userId', ParseIntPipe) userId: number): Promise<CouponResponseDto[]> {
    return this.getUserCouponsUseCase.execute(userId);
  }

  @Get('ranking/:couponType')
  @ApiOperation({ summary: '쿠폰 발급 순위 조회' })
  @ApiParam({ name: 'couponType', description: '쿠폰 타입' })
  @ApiQuery({ name: 'limit', description: '조회할 순위 수', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: '쿠폰 발급 순위 조회 성공'
  })
  async getCouponRanking(
    @Param('couponType') couponType: string,
    @Query('limit') limit: number = 10
  ) {
    return this.couponsService.getCouponRanking(couponType, limit);
  }

  @Get('status/:couponType')
  @ApiOperation({ summary: '쿠폰 발급 대기열 상태 조회' })
  @ApiParam({ name: 'couponType', description: '쿠폰 타입' })
  @ApiResponse({ 
    status: 200, 
    description: '쿠폰 발급 대기열 상태 조회 성공'
  })
  async getCouponQueueStatus(@Param('couponType') couponType: string) {
    return this.couponsService.getCouponQueueStatus(couponType);
  }
} 