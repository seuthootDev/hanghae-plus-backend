import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChargePointsDto, PointsResponseDto } from './dto/points.dto';

@ApiTags('Points')
@Controller('points')
export class PointsController {
  @Post('charge')
  @ApiOperation({ summary: '포인트 충전' })
  @ApiResponse({ status: 201, description: '포인트 충전 성공', type: PointsResponseDto })
  async chargePoints(@Body() chargePointsDto: ChargePointsDto) {
    return {
      userId: chargePointsDto.userId,
      amount: chargePointsDto.amount
    };
  }

  @Get(':userId')
  @ApiOperation({ summary: '포인트 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '포인트 조회 성공', type: PointsResponseDto })
  async getUserPoints(@Param('userId') userId: string) {
    return {
      userId: parseInt(userId),
      amount: 15000
    };
  }
} 