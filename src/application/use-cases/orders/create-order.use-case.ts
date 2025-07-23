import { Injectable, Inject } from '@nestjs/common';
import { CreateOrderDto } from '../../../presentation/dto/ordersDTO/create-order.dto';
import { OrderResponseDto } from '../../../presentation/dto/ordersDTO/order-response.dto';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/orders-service.interface';
import { OrderPresenterInterface, ORDER_PRESENTER } from '../../interfaces/presenters/order-presenter.interface';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersService: OrdersServiceInterface,
    @Inject(ORDER_PRESENTER)
    private readonly orderPresenter: OrderPresenterInterface
  ) {}

  async execute(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const order = await this.ordersService.createOrder(createOrderDto);
    return this.orderPresenter.presentOrder(order);
  }
} 