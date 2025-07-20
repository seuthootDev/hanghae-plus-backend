import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProcessPaymentDto } from '../dto/paymentsDTO/process-payment.dto';
import { PaymentResponseDto } from '../dto/paymentsDTO/payment-response.dto';
import { PaymentsServiceInterface, PAYMENTS_SERVICE } from '../../application/interfaces/services/payments-service.interface';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {

  constructor(
    @Inject(PAYMENTS_SERVICE)
    private readonly paymentsService: PaymentsServiceInterface
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
    return this.paymentsService.processPayment(processPaymentDto);
  }
} 