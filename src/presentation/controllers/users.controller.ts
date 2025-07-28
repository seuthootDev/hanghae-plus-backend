import { Controller, Post, Get, Param, Body, ParseIntPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChargePointsDto } from '../dto/usersDTO/charge-points.dto';
import { PointsResponseDto } from '../dto/usersDTO/points-response.dto';
import { ChargePointsUseCase } from '../../application/use-cases/users/charge-points.use-case';
import { GetUserPointsUseCase } from '../../application/use-cases/users/get-user-points.use-case';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  
  constructor(
    private readonly chargePointsUseCase: ChargePointsUseCase,
    private readonly getUserPointsUseCase: GetUserPointsUseCase
  ) {}
  
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
    return this.chargePointsUseCase.execute(userId, chargePointsDto);
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
    return this.getUserPointsUseCase.execute(userId);
  }
} 