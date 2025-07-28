import { Injectable, BadRequestException, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ProcessPaymentDto } from '../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface } from '../../application/interfaces/services/payments-service.interface';
import { PaymentRepositoryInterface, PAYMENT_REPOSITORY } from '../../application/interfaces/repositories/payment-repository.interface';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../application/interfaces/repositories/order-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentValidationService } from '../../domain/services/payment-validation.service';
import { UserValidationService } from '../../domain/services/user-validation.service';

@Injectable()
export class PaymentsService implements PaymentsServiceInterface {
  
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryInterface,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    private readonly paymentValidationService: PaymentValidationService,
    private readonly userValidationService: UserValidationService
  ) {}

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<Payment> {
    const { orderId } = processPaymentDto;
    
    try {
      // 주문 조회
      const order = await this.orderRepository.findById(orderId);
      
      // 사용자 조회
      const user = await this.userRepository.findById(order?.userId || 0);
      
      // 결제 생성
      const payment = new Payment(
        0, // ID는 저장 시 할당
        orderId,
        order?.userId || 0,
        order?.totalAmount || 0,
        order?.discountAmount || 0,
        order?.finalAmount || 0,
        order?.couponUsed || false,
        'PENDING',
        new Date()
      );
      
      // 도메인 서비스를 사용한 전체 검증
      this.paymentValidationService.validatePayment(order, user, payment);
      
      // 결제 처리
      payment.processPayment();
      
      // 결제 저장
      const savedPayment = await this.paymentRepository.save(payment);
      
      // 사용자 포인트 차감
      this.userValidationService.validateUsePoints(user!, order!.finalAmount);
      user!.usePoints(order!.finalAmount);
      await this.userRepository.save(user!);
      
      return savedPayment;
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
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }
} 