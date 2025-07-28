import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcessPaymentDto } from '../../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../interfaces/services/payments-service.interface';
import { PaymentPresenterInterface, PAYMENT_PRESENTER } from '../../interfaces/presenters/payment-presenter.interface';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../interfaces/repositories/order-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../interfaces/repositories/user-repository.interface';
import { PaymentValidationService } from '../../../domain/services/payment-validation.service';
import { UserValidationService } from '../../../domain/services/user-validation.service';
import { Transactional } from '../../../common/decorators/transactional.decorator';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PAYMENTS_SERVICE)
    private readonly paymentsService: PaymentsServiceInterface,
    @Inject(PAYMENT_PRESENTER)
    private readonly paymentPresenter: PaymentPresenterInterface,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly paymentValidationService: PaymentValidationService,
    private readonly userValidationService: UserValidationService
  ) {}

  @Transactional()
  async execute(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    const { orderId } = processPaymentDto;
    
    try {
      // 1. 주문 조회 및 검증
      const order = await this.orderRepository.findById(orderId);
      this.paymentValidationService.validateOrderExists(order);
      
      // 2. 사용자 조회 및 검증
      const user = await this.userRepository.findById(order!.userId);
      this.paymentValidationService.validateUserExists(user);
      
      // 3. 결제 가능 여부 검증
      this.paymentValidationService.validatePaymentPossible(order!, user!);
      
      // 4. 결제 생성 (간소화된 서비스 사용)
      const payment = await this.paymentsService.processPayment({
        orderId: order!.id,
        userId: order!.userId,
        totalAmount: order!.totalAmount,
        discountAmount: order!.discountAmount,
        finalAmount: order!.finalAmount,
        couponUsed: order!.couponUsed
      });
      
      // 5. 사용자 포인트 차감
      this.userValidationService.validateUsePoints(user!, order!.finalAmount);
      user!.usePoints(order!.finalAmount);
      await this.userRepository.save(user!);
      
      // 6. 주문 상태 업데이트
      order!.updateStatus('PAID');
      await this.orderRepository.save(order!);
      
      return this.paymentPresenter.presentPayment(payment);
    } catch (error) {
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