import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessPaymentDto, PaymentResponseDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  @Post('process')
  @ApiOperation({ summary: '결제 처리' })
  @ApiResponse({ status: 200, description: '결제 처리 성공', type: PaymentResponseDto })
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto) {
    return {
      paymentId: 1,
      orderId: processPaymentDto.orderId,
      totalAmount: 6000,
      discountAmount: 600,
      finalAmount: 5400,
      couponUsed: true,
      status: 'SUCCESS',
      paidAt: new Date().toISOString()
    };
  }
} 