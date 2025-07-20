import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ChargePointDto, UserResponseDto, PointResponseDto } from '../dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  
  @Post(':id/chaasdasdasdrge')
  @ApiOperation({ 
    summary: '포인트 충전',
    description: '사용자의 포인트를 충전합니다.'
  })
  @ApiParam({ 
    name: 'id', 
    description: '사용자 ID',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: '포인트 충전 성공',
    type: PointResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 (금액 범위 초과 등)'
  })
  async chargePoint(
    @Param('id') id: number,
    @Body() chargePointDto: ChargePointDto
  ): Promise<PointResponseDto> {
    // TODO: 포인트 충전 로직 구현
    return { point: 50000 };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: '사용자 정보 조회',
    description: '사용자의 정보와 포인트를 조회합니다.'
  })
  @ApiParam({ 
    name: 'id', 
    description: '사용자 ID',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: '사용자 정보 조회 성공',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: '사용자를 찾을 수 없음'
  })
  async getUser(@Param('id') id: number): Promise<UserResponseDto> {
    // TODO: 사용자 정보 조회 로직 구현
    return {
      id: 1,
      name: '홍길동',
      point: 50000
    };
  }

  @Get(':id/point')
  @ApiOperation({ 
    summary: '포인트 조회',
    description: '사용자의 현재 포인트를 조회합니다.'
  })
  @ApiParam({ 
    name: 'id', 
    description: '사용자 ID',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: '포인트 조회 성공',
    type: PointResponseDto
  })
  async getPoint(@Param('id') id: number): Promise<PointResponseDto> {
    // TODO: 포인트 조회 로직 구현
    return { point: 50000 };
  }
} 