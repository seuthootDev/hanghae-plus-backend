import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IssueCouponDto, ValidateCouponDto, CouponResponseDto } from './dto/coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  @Post('issue')
  @ApiOperation({ summary: '쿠폰 발급' })
  @ApiResponse({ status: 201, description: '쿠폰 발급 성공', type: CouponResponseDto })
  async issueCoupon(@Body() issueCouponDto: IssueCouponDto) {
    return {
      couponId: 10,
      userId: issueCouponDto.userId,
      couponType: issueCouponDto.couponType,
      discountRate: 10,
      expiryDate: '2024-12-31',
      isUsed: false
    };
  }

  @Post('validate')
  @ApiOperation({ summary: '쿠폰 유효성 검증' })
  @ApiResponse({ status: 200, description: '쿠폰 유효성 검증 성공' })
  async validateCoupon(@Body() validateCouponDto: ValidateCouponDto) {
    return {
      valid: true,
      discountRate: 10,
      couponType: 'DISCOUNT_10PERCENT'
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '사용자 보유 쿠폰 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '보유 쿠폰 조회 성공', type: [CouponResponseDto] })
  async getUserCoupons(@Param('userId') userId: string) {
    return [
      {
        couponId: 10,
        userId: parseInt(userId),
        couponType: 'DISCOUNT_10PERCENT',
        discountRate: 10,
        expiryDate: '2024-12-31',
        isUsed: false
      }
    ];
  }
} 