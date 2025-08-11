import { Injectable, BadRequestException, Inject, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ProcessPaymentDto } from '../../presentation/dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface } from '../../application/interfaces/services/payments-service.interface';
import { PaymentRepositoryInterface, PAYMENT_REPOSITORY } from '../../application/interfaces/repositories/payment-repository.interface';
import { Payment } from '../../domain/entities/payment.entity';

@Injectable()
export class PaymentsService implements PaymentsServiceInterface {
  
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepositoryInterface
  ) {}

  async processPayment(paymentData: {
    orderId: number;
    userId: number;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponUsed: boolean;
  }): Promise<Payment> {
    try {
      // 결제 생성
      const payment = new Payment(
        0, // ID는 저장 시 할당
        paymentData.orderId,
        paymentData.userId,
        paymentData.totalAmount,
        paymentData.discountAmount,
        paymentData.finalAmount,
        paymentData.couponUsed,
        'PENDING',
        new Date()
      );
      
      // 결제 처리
      payment.processPayment();
      
      // 결제 저장
      const savedPayment = await this.paymentRepository.save(payment);
      
      return savedPayment;
    } catch (error) {
      // 도메인 예외를 HTTP 예외로 변환
      if (error.message.includes('결제 데이터가 유효하지 않습니다')) {
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
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  async findById(paymentId: number): Promise<Payment | null> {
    return this.paymentRepository.findById(paymentId);
  }

  async save(payment: Payment): Promise<Payment> {
    return this.paymentRepository.save(payment);
  }

  // 결제 조회 (주문별)
  async findByOrderId(orderId: number): Promise<Payment[]> {
    return this.paymentRepository.findByOrderId(orderId);
  }

  // 결제 조회 (사용자별)
  async findByUserId(userId: number): Promise<Payment[]> {
    return this.paymentRepository.findByUserId(userId);
  }
} 