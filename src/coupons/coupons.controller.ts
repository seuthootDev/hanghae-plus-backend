import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IssueCouponDto } from './dto/issue-coupon.dto';
import { CouponResponseDto } from './dto/coupon-response.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {

  @Post('issue')
  @ApiOperation({ summary: '쿠폰 발급' })
  @ApiResponse({ 
    status: 201, 
    description: '쿠폰 발급 성공',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 400, description: '쿠폰 소진' })
  async issueCoupon(@Body() issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    // TODO: 실제 비즈니스 로직 구현
    return {
      couponId: 10,
      userId: 1,
      couponType: 'DISCOUNT_10PERCENT',
      discountRate: 10,
      expiryDate: '2024-12-31',
      isUsed: false
    };
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
    // TODO: 실제 비즈니스 로직 구현
    return [
      {
        couponId: 10,
        userId: 1,
        couponType: 'DISCOUNT_10PERCENT',
        discountRate: 10,
        expiryDate: '2024-12-31',
        isUsed: false
      }
    ];
  }
} 