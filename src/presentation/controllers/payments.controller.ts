import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessPaymentDto } from '../dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../dto/paymentsDTO/payment-response.dto';
import { ProcessPaymentUseCase } from '../../application/use-cases/payments/process-payment.use-case';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {

  constructor(
    private readonly processPaymentUseCase: ProcessPaymentUseCase
  ) {}

  @Post('process')
  @ApiOperation({ summary: '결제 처리' })
  @ApiResponse({ 
    status: 200, 
    description: '결제 처리 성공',
    type: PaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: '잔액 부족' })
  async processPayment(@Body() processPaymentDto: ProcessPaymentDto): Promise<PaymentResponseDto> {
    return this.processPaymentUseCase.execute(processPaymentDto);
  }
} 