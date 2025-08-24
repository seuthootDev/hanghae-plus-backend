import { Controller, Post, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IssueCouponDto } from '../dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../dto/couponsDTO/coupon-response.dto';
import { IssueCouponUseCase } from '../../application/use-cases/coupons/issue-coupon.use-case';
import { GetUserCouponsUseCase } from '../../application/use-cases/coupons/get-user-coupons.use-case';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../application/interfaces/services/coupon-service.interface';
import { Inject } from '@nestjs/common';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {

  constructor(
    private readonly issueCouponUseCase: IssueCouponUseCase,
    private readonly getUserCouponsUseCase: GetUserCouponsUseCase,
    @Inject(COUPONS_SERVICE)
    private readonly couponsService: CouponsServiceInterface
  ) {}

  @Post('issue')
  @ApiOperation({ summary: '쿠폰 발급' })
  @ApiResponse({ 
    status: 201, 
    description: '쿠폰 발급 성공',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 400, description: '쿠폰 소진' })
  async issueCoupon(@Body() issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    return this.issueCouponUseCase.execute(issueCouponDto);
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