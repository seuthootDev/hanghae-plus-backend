import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @ApiOperation({ summary: '결제 처리' })
  @ApiResponse({ 
    status: 200, 
    description: '결제 처리 성공',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: '잔액 부족' })
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    return this.paymentsService.processPayment(processPaymentDto);
  }
} 