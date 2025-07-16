import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {

  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({ 
    status: 201, 
    description: '주문 생성 성공',
    type: OrderResponseDto 
  })
  @ApiResponse({ status: 400, description: '재고 부족' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    // TODO: 실제 비즈니스 로직 구현
    return {
      orderId: 100,
      userId: 1,
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