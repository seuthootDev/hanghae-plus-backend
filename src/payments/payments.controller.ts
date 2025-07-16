import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {

  @Post('process')
  @ApiOperation({ summary: '결제 처리' })
  @ApiResponse({ 
    status: 200, 
    description: '결제 처리 성공',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: '잔액 부족' })
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    // TODO: 실제 비즈니스 로직 구현
    return {
      paymentId: 1,
      orderId: 100,
      totalAmount: 6000,
      discountAmount: 600,
      finalAmount: 5400,
      couponUsed: true,
      status: 'SUCCESS',
      paidAt: new Date('2024-01-15T10:30:00Z')
    };
  }
} 