import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateOrderDto } from '../dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../dto/ordersDTO/order-response.dto';
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {

  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase
  ) {}

  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({ 
    status: 201, 
    description: '주문 생성 성공',
    type: OrderResponseDto 
  })
  @ApiResponse({ status: 400, description: '재고 부족' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.createOrderUseCase.execute(createOrderDto);
  }
} 