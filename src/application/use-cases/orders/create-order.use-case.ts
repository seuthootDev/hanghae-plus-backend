import { Injectable, Inject } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/orders-service.interface';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersService: OrdersServiceInterface
  ) {}

  async execute(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(createOrderDto);
  }
} 