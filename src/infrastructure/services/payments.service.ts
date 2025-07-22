import { Injectable, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { ProcessPaymentDto } from '../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface } from '../../application/interfaces/services/payments-service.interface';
import { PaymentRepositoryInterface, PAYMENT_REPOSITORY } from '../../application/interfaces/repositories/payment-repository.interface';
import { OrderRepositoryInterface, ORDER_REPOSITORY } from '../../application/interfaces/repositories/order-repository.interface';
import { UserRepositoryInterface, USER_REPOSITORY } from '../../application/interfaces/repositories/user-repository.interface';
import { Payment } from '../../domain/entities/payment.entity';

@Injectable()
export class PaymentsService implements PaymentsServiceInterface {
  
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryInterface,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryInterface,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface
  ) {}

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    const { orderId } = processPaymentDto;
    
    // 주문 조회
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new BadRequestException(`주문 ID ${orderId}를 찾을 수 없습니다.`);
    }
    
    // 사용자 조회 및 포인트 확인
    const user = await this.userRepository.findById(order.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    
    if (user.points < order.finalAmount) {
      throw new BadRequestException('포인트가 부족합니다.');
    }
    
    // 결제 생성
    const payment = new Payment(
      0, // ID는 저장 시 할당
      orderId,
      order.userId,
      order.totalAmount,
      order.discountAmount,
      order.finalAmount,
      order.couponUsed,
      'PENDING',
      new Date()
    );
    
    // 결제 처리
    payment.processPayment();
    
    // 결제 저장
    const savedPayment = await this.paymentRepository.save(payment);
    
    // 사용자 포인트 차감
    user.usePoints(order.finalAmount);
    await this.userRepository.save(user);
    
    return {
      paymentId: savedPayment.id,
      orderId: savedPayment.orderId,
      totalAmount: savedPayment.totalAmount,
      discountAmount: savedPayment.discountAmount,
      finalAmount: savedPayment.finalAmount,
      couponUsed: savedPayment.couponUsed,
      status: savedPayment.status,
      paidAt: savedPayment.paidAt
    };
  }
} 