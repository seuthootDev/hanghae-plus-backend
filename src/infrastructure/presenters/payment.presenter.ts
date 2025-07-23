import { Injectable } from '@nestjs/common';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentResponseDto } from '../../presentation/dto/paymentsDTO/payment-response.dto';
import { PaymentPresenterInterface } from '../../application/interfaces/presenters/payment-presenter.interface';

@Injectable()
export class PaymentPresenter implements PaymentPresenterInterface {
  
  presentPayment(payment: Payment): PaymentResponseDto {
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
  }

  presentPaymentList(payments: Payment[]): PaymentResponseDto[] {
    return payments.map(payment => this.presentPayment(payment));
  }
} 