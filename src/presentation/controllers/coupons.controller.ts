import { Controller, Post, Get, Body, Param, ParseIntPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IssueCouponDto } from '../dto/couponsDTO/issue-coupon.dto';
import { CouponResponseDto } from '../dto/couponsDTO/coupon-response.dto';
import { CouponsServiceInterface, COUPONS_SERVICE } from '../../application/interfaces/services/coupons-service.interface';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {

  constructor(
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