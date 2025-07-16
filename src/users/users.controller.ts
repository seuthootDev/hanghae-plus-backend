import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChargePointsDto } from './dto/charge-points.dto';
import { PointsResponseDto } from './dto/points-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  
  @Post(':userId/points')
  @ApiOperation({ summary: '포인트 충전' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '포인트 충전 성공',
    type: PointsResponseDto 
  })
  @ApiResponse({ status: 400, description: '최소,최대 금액 오류' })
  async chargePoints(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() chargePointsDto: ChargePointsDto
  ): Promise<PointsResponseDto> {
    // TODO: 실제 비즈니스 로직 구현
    return {
      userId,
      balance: 15000
    };
  }

  @Get(':userId/points')
  @ApiOperation({ summary: '포인트 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '포인트 조회 성공',
    type: PointsResponseDto 
  })
  async getUserPoints(
    @Param('userId', ParseIntPipe) userId: number
  ): Promise<PointsResponseDto> {
    // TODO: 실제 비즈니스 로직 구현
    return {
      userId,
      balance: 15000
    };
  }
} 