import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IssueCouponDto } from '../dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../dto/couponsDTO/coupon-response.dto';
import { IssueCouponUseCase } from '../../application/use-cases/coupons/issue-coupon.use-case';
import { GetUserCouponsUseCase } from '../../application/use-cases/coupons/get-user-coupons.use-case';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {

  constructor(
    private readonly issueCouponUseCase: IssueCouponUseCase,
    private readonly getUserCouponsUseCase: GetUserCouponsUseCase
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
} 