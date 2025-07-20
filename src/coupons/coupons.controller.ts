import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IssueCouponDto } from './dto/issue-coupon.dto';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { CouponsService } from './coupons.service';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {

  constructor(private readonly couponsService: CouponsService) {}

  @Post('issue')
  @ApiOperation({ summary: '쿠폰 발급' })
  @ApiResponse({ 
    status: 201, 
    description: '쿠폰 발급 성공',
    type: CouponResponseDto 
  })
  @ApiResponse({ status: 400, description: '쿠폰 소진' })
  async issueCoupon(@Body() issueCouponDto: IssueCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.issueCoupon(issueCouponDto);
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
    return this.couponsService.getUserCoupons(userId);
  }
} 