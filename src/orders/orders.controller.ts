import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderDto, OrderResponseDto } from './dto/order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({ status: 201, description: '주문 생성 성공', type: OrderResponseDto })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return {
      orderId: 100,
      userId: createOrderDto.userId,
      items: [
        {
          productId: 1,
          quantity: 2,
          price: 3000
        }
      ],
      totalAmount: 6000,
      discountAmount: 600,
      finalAmount: 5400,
      couponUsed: true,
      status: 'PENDING'
    };
  }
} 