import { Injectable } from '@nestjs/common';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  
  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    // Mock 비즈니스 로직: 결제 처리
    const { orderId } = processPaymentDto;
    
    // Mock 주문 데이터
    const mockOrders = {
      100: {
        orderId: 100,
        userId: 1,
        totalAmount: 6000,
        discountAmount: 600,
        finalAmount: 5400,
        couponUsed: true
      },
      101: {
        orderId: 101,
        userId: 2,
        totalAmount: 12000,
        discountAmount: 0,
        finalAmount: 12000,
        couponUsed: false
      }
    };
    
    const order = mockOrders[orderId];
    if (!order) {
      throw new Error(`주문 ID ${orderId}를 찾을 수 없습니다.`);
    }
    
    // Mock 사용자 포인트 데이터
    const mockUserPoints = {
      1: 15000,
      2: 8000
    };
    
    const userPoints = mockUserPoints[order.userId];
    if (userPoints < order.finalAmount) {
      throw new Error('포인트가 부족합니다.');
    }
    
    // 결제 성공 처리
    const paymentId = Math.floor(Math.random() * 1000) + 1;
    const paidAt = new Date();
    
    return {
      paymentId,
      orderId,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      couponUsed: order.couponUsed,
      status: 'SUCCESS',
      paidAt
    };
  }
} 