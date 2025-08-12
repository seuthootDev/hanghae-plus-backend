import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../../../src/infrastructure/services/payment.service';
import { PaymentRepositoryInterface, PAYMENT_REPOSITORY } from '../../../src/application/interfaces/repositories/payment-repository.interface';
import { Payment } from '../../../src/domain/entities/payment.entity';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPaymentRepository: jest.Mocked<PaymentRepositoryInterface>;

  beforeEach(async () => {
    const mockPaymentRepositoryProvider = {
      provide: PAYMENT_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        save: jest.fn(),
        findByOrderId: jest.fn(),
        findByUserId: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        mockPaymentRepositoryProvider,
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    mockPaymentRepository = module.get('PAYMENT_REPOSITORY');
  });

  describe('processPayment', () => {
    it('결제 처리가 성공적으로 처리되어야 한다', async () => {
      // Arrange
      const paymentData = {
        orderId: 1,
        userId: 1,
        totalAmount: 20000,
        discountAmount: 2000,
        finalAmount: 18000,
        couponUsed: true,
      };

      const mockPayment = new Payment(1, 1, 1, 20000, 2000, 18000, true, 'COMPLETED', new Date());
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      // Act
      const result = await service.processPayment(paymentData);

      // Assert
      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('결제를 성공적으로 찾아야 한다', async () => {
      // Arrange
      const paymentId = 1;
      const mockPayment = new Payment(1, 1, 1, 20000, 2000, 18000, true, 'COMPLETED', new Date());
      mockPaymentRepository.findById.mockResolvedValue(mockPayment);

      // Act
      const result = await service.findById(paymentId);

      // Assert
      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith(paymentId);
    });

    it('결제가 존재하지 않으면 null을 반환해야 한다', async () => {
      // Arrange
      const paymentId = 999;
      mockPaymentRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(paymentId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('결제를 성공적으로 저장해야 한다', async () => {
      // Arrange
      const mockPayment = new Payment(1, 1, 1, 20000, 2000, 18000, true, 'COMPLETED', new Date());
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      // Act
      const result = await service.save(mockPayment);

      // Assert
      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.save).toHaveBeenCalledWith(mockPayment);
    });
  });

  describe('findByOrderId', () => {
    it('주문별 결제 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const orderId = 1;
      const mockPayments = [
        new Payment(1, orderId, 1, 20000, 2000, 18000, true, 'COMPLETED', new Date()),
        new Payment(2, orderId, 1, 15000, 0, 15000, false, 'PENDING', new Date()),
      ];

      mockPaymentRepository.findByOrderId.mockResolvedValue(mockPayments);

      // Act
      const result = await service.findByOrderId(orderId);

      // Assert
      expect(result).toEqual(mockPayments);
      expect(mockPaymentRepository.findByOrderId).toHaveBeenCalledWith(orderId);
    });
  });

  describe('findByUserId', () => {
    it('사용자별 결제 목록을 성공적으로 반환해야 한다', async () => {
      // Arrange
      const userId = 1;
      const mockPayments = [
        new Payment(1, 1, userId, 20000, 2000, 18000, true, 'COMPLETED', new Date()),
        new Payment(2, 2, userId, 15000, 0, 15000, false, 'PENDING', new Date()),
      ];

      mockPaymentRepository.findByUserId.mockResolvedValue(mockPayments);

      // Act
      const result = await service.findByUserId(userId);

      // Assert
      expect(result).toEqual(mockPayments);
      expect(mockPaymentRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
}); 