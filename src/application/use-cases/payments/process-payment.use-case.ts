import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcessPaymentDto } from '../../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../interfaces/services/payments-service.interface';
import { OrdersServiceInterface, ORDERS_SERVICE } from '../../interfaces/services/orders-service.interface';
import { UsersServiceInterface, USERS_SERVICE } from '../../interfaces/services/users-service.interface';
import { ProductsServiceInterface, PRODUCTS_SERVICE } from '../../interfaces/services/products-service.interface';
import { PaymentValidationService } from '../../../domain/services/payment-validation.service';
import { UserValidationService } from '../../../domain/services/user-validation.service';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import { OptimisticLock } from '../../../common/decorators/optimistic-lock.decorator';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_SERVICE)
    private readonly paymentsService: PaymentsServiceInterface,
    @Inject(ORDERS_SERVICE)
    private readonly ordersService: OrdersServiceInterface,
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface,
    @Inject(PRODUCTS_SERVICE)
    private readonly productsService: ProductsServiceInterface,
    private readonly paymentValidationService: PaymentValidationService,
    private readonly userValidationService: UserValidationService
  ) {}

  @Transactional()
  @OptimisticLock({
    key: 'payment:process:${args[0].orderId}',
    maxRetries: 3,
    retryDelay: 100,
    errorMessage: '결제 처리 중입니다. 잠시 후 다시 시도해주세요.'
  })
  async execute(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    const { orderId } = processPaymentDto;
    let order: any = null;
    
    try {
      // 1. 주문 조회 및 검증 (OrdersService 사용)
      order = await this.ordersService.findById(orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }
      this.paymentValidationService.validateOrderExists(order);
      
      // 2. 사용자 조회 및 검증 (UsersService 사용)
      const user = await this.usersService.validateUser(order!.userId);
      
      // 3. 결제 가능 여부 검증
      this.paymentValidationService.validatePaymentPossible(order!, user!);
      
      // 4. 결제 생성 (PaymentsService 사용)
      const payment = await this.paymentsService.processPayment({
        orderId: order!.id,
        userId: order!.userId,
        totalAmount: order!.totalAmount,
        discountAmount: order!.discountAmount,
        finalAmount: order!.finalAmount,
        couponUsed: order!.couponUsed
      });
      
      // 5. 사용자 포인트 차감 (UsersService 사용)
      await this.usersService.usePoints(order!.userId, order!.finalAmount);
      
      // 6. 주문 상태 업데이트 (OrdersService 사용)
      await this.ordersService.updateOrderStatus(order!.id, 'PAID');
      
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        totalAmount: payment.totalAmount,
        discountAmount: payment.discountAmount,
        finalAmount: payment.finalAmount,
        couponUsed: payment.couponUsed,
        status: payment.status,
        paidAt: payment.paidAt
      };
    } catch (error) {
      // 결제 실패 시 재고 반환
      if (order) {
        try {
          for (const item of order.items) {
            const product = await this.productsService.findById(item.productId);
            if (product) {
              product.increaseStock(item.quantity);
              await this.productsService.save(product);
            }
          }
        } catch (stockError) {
          // 재고 반환 실패는 로그만 남기고 원래 에러를 던짐
          console.error('재고 반환 실패:', stockError);
        }
      }
      
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('주문을 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('이미 처리된 주문입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('포인트가 부족합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('결제 금액은 0원보다 커야 합니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('최종 금액은 총 금액을 초과할 수 없습니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('이미 처리된 결제입니다')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('포인트 사용 금액은 최소 1,000원 이상이어야 합니다')) {
        throw new BadRequestException(error.message);
      }
      
      // 기타 예외는 그대로 전파
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || '결제 처리 중 오류가 발생했습니다.');
    }
  }
} 