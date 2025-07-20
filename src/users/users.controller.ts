import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChargePointsDto } from './dto/charge-points.dto';
import { PointsResponseDto } from './dto/points-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  
  constructor(private readonly usersService: UsersService) {}
  
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
    return this.usersService.chargePoints(userId, chargePointsDto);
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
    return this.usersService.getUserPoints(userId);
  }
} 