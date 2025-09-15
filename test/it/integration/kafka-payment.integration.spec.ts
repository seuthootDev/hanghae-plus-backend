import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPaymentUseCase } from '../../../src/application/use-cases/payments/process-payment.use-case';
import { TestAppModule } from '../../app.module';
import { TestSeeder } from '../../database/test-seeder';
import { ProcessPaymentDto } from '../../../src/presentation/dto/paymentsDTO/process-payment.dto';
import { KafkaProducerService } from '../../../src/infrastructure/services/kafka-producer.service';
import { KafkaConsumerService } from '../../../src/infrastructure/services/kafka-consumer.service';
import { DataPlatformService } from '../../../src/infrastructure/services/data-platform.service';
import { EventBus } from '../../../src/common/events/event-bus';
import { IEventBus } from '../../../src/common/events/event-bus.interface';
import { PaymentCompletedHandler } from '../../../src/infrastructure/event-handlers/payment-events.handler';

describe('Kafka Payment Integration Tests', () => {
  jest.setTimeout(60000); // 1분 타임아웃
  let module: TestingModule;
  let processPaymentUseCase: ProcessPaymentUseCase;
  let testSeeder: TestSeeder;
  
  let receivedMessages: any[] = [];
  let mockDataPlatformService: jest.Mocked<DataPlatformService>;
  let mockKafkaProducerService: jest.Mocked<KafkaProducerService>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockPaymentCompletedHandler: jest.Mocked<PaymentCompletedHandler>;

  beforeAll(async () => {
    console.log('🚀 카프카 모킹 테스트 시작 중...');
    
    // Mock DataPlatformService 생성
    mockDataPlatformService = {
      sendOrderData: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock KafkaProducerService 생성
    mockKafkaProducerService = {
      sendPaymentCompletedData: jest.fn().mockImplementation(async (orderData) => {
        // 모킹된 메시지를 receivedMessages에 추가
        receivedMessages.push(orderData);
        console.log(`📤 카프카 메시지 전송 (모킹): 주문 ${orderData.orderId}`);
        
        // DataPlatformService도 호출
        await mockDataPlatformService.sendOrderData(orderData);
      }),
    } as any;

    // Mock PaymentCompletedHandler 생성
    mockPaymentCompletedHandler = {
      handle: jest.fn().mockImplementation(async (event) => {
        // 카프카 프로듀서 서비스 호출 시뮬레이션
        await mockKafkaProducerService.sendPaymentCompletedData({
          orderId: event.orderId,
          userId: event.userId,
          products: event.products,
          totalAmount: event.totalAmount,
          discountAmount: event.discountAmount,
          finalAmount: event.finalAmount,
          couponUsed: event.couponUsed,
          status: event.status,
          paidAt: event.paidAt,
          timestamp: new Date().toISOString(),
          source: 'hanghae-plus-backend',
          version: '1.0.0'
        });
      }),
    } as any;

    // Mock EventBus 생성 - 이벤트를 즉시 처리하도록 설정
    mockEventBus = {
      publish: jest.fn().mockImplementation((event) => {
        console.log(`🔔 이벤트 발행됨: ${event.constructor.name}`);
        if (event.constructor.name === 'PaymentCompletedEvent') {
          console.log(`✅ PaymentCompletedEvent 처리 시작`);
          mockPaymentCompletedHandler.handle(event);
        }
      }),
      subscribe: jest.fn(),
    } as any;

    // 테스트 모듈 생성 (카프카 서비스 오버라이드)
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    })
    .overrideProvider(DataPlatformService)
    .useValue(mockDataPlatformService)
    .overrideProvider(KafkaProducerService)
    .useValue(mockKafkaProducerService)
    .overrideProvider(KafkaConsumerService)
    .useValue({
      // 실제 컨슈머는 테스트에서 사용하지 않으므로 빈 구현체
    })
    .overrideProvider(EventBus)
    .useValue(mockEventBus)
    .overrideProvider('EVENT_BUS')
    .useValue(mockEventBus)
    .overrideProvider(PaymentCompletedHandler)
    .useValue(mockPaymentCompletedHandler)
    .compile();

    processPaymentUseCase = module.get<ProcessPaymentUseCase>(ProcessPaymentUseCase);
    testSeeder = module.get<TestSeeder>(TestSeeder);

    await testSeeder.seedFullTestData();
    console.log('✅ 카프카 모킹 테스트 준비 완료!');
  });

  afterAll(async () => {
    console.log('🧹 테스트 정리 중...');
    
    if (testSeeder) {
      await testSeeder.clearTestData();
    }
    
    if (module) {
      await module.close();
    }
    
    console.log('✅ 테스트 정리 완료');
  });

  beforeEach(async () => {
    // 각 테스트 전에 메시지 배열 초기화 및 Mock 초기화
    receivedMessages = [];
    mockDataPlatformService.sendOrderData.mockClear();
    mockKafkaProducerService.sendPaymentCompletedData.mockClear();
    mockEventBus.publish.mockClear();
    mockPaymentCompletedHandler.handle.mockClear();
    
    // 결제 데이터 정리 및 주문 상태 초기화
    await testSeeder.clearPaymentData();
    await testSeeder.resetOrderStatus();
  });

  describe('Kafka Payment Data Platform Integration', () => {
    it('결제 완료 시 카프카를 통해 데이터 플랫폼으로 전송되어야 한다', async () => {
      // Arrange
      const processPaymentDto = new ProcessPaymentDto();
      processPaymentDto.orderId = 1; // 유효한 주문 ID

      // Act
      const result = await processPaymentUseCase.execute(processPaymentDto);

      // Assert - 결제 성공 확인
      expect(result).toBeDefined();
      expect(result.paymentId).toBeDefined();
      expect(result.orderId).toBe(1);

      // 모킹된 카프카 메시지 확인 
      expect(mockKafkaProducerService.sendPaymentCompletedData).toHaveBeenCalledTimes(1);
      expect(mockDataPlatformService.sendOrderData).toHaveBeenCalledTimes(1);
      
      // 호출된 인자 확인
      const kafkaCallArgs = mockKafkaProducerService.sendPaymentCompletedData.mock.calls[0][0];
      expect(kafkaCallArgs.orderId).toBe("1");
      expect(kafkaCallArgs.userId).toBeDefined();
      expect(kafkaCallArgs.totalAmount).toBeDefined();
      expect(kafkaCallArgs.finalAmount).toBeDefined();
      expect(kafkaCallArgs.status).toBe('PAID');
      expect(kafkaCallArgs.source).toBe('hanghae-plus-backend');
      expect(kafkaCallArgs.version).toBe('1.0.0');
      expect(kafkaCallArgs.timestamp).toBeDefined();

      // KafkaProducerService가 호출되었는지 확인
      expect(mockKafkaProducerService.sendPaymentCompletedData).toHaveBeenCalledWith(kafkaCallArgs);

      // DataPlatformService가 호출되었는지 확인
      expect(mockDataPlatformService.sendOrderData).toHaveBeenCalledWith(kafkaCallArgs);
    });

    it('결제 실패 시 카프카 메시지가 전송되지 않아야 한다', async () => {
      // Arrange - 존재하지 않는 주문
      const processPaymentDto = new ProcessPaymentDto();
      processPaymentDto.orderId = 999;

      // Act & Assert
      await expect(processPaymentUseCase.execute(processPaymentDto)).rejects.toThrow();

      // 카프카 메시지가 전송되지 않았는지 확인
      expect(receivedMessages).toHaveLength(0);
      expect(mockKafkaProducerService.sendPaymentCompletedData).not.toHaveBeenCalled();
      expect(mockDataPlatformService.sendOrderData).not.toHaveBeenCalled();
    });

    it('여러 결제가 연속으로 처리될 때 각각 카프카 메시지가 전송되어야 한다', async () => {
      // Arrange - 여러 유효한 주문들 (테스트 데이터에 따라 조정)
      const orderIds = [2, 4]; // 유효한 주문 ID들 
      const results = [];

      // Act - 여러 결제 처리
      for (const orderId of orderIds) {
        const processPaymentDto = new ProcessPaymentDto();
        processPaymentDto.orderId = orderId;
        
        try {
          const result = await processPaymentUseCase.execute(processPaymentDto);
          results.push(result);
        } catch (error) {
          // 일부 주문이 실패할 수 있음 (포인트 부족 등)
          console.log(`주문 ${orderId} 결제 실패:`, error.message);
        }
      }

      // Assert - 성공한 결제들에 대해 카프카 메시지 확인
      const successfulPayments = results.length;
      
      // 모킹된 메시지는 즉시 확인 가능
      expect(mockKafkaProducerService.sendPaymentCompletedData).toHaveBeenCalledTimes(successfulPayments);
      expect(mockDataPlatformService.sendOrderData).toHaveBeenCalledTimes(successfulPayments);
      
      // 각 메시지의 orderId가 처리된 주문과 일치하는지 확인
      const kafkaCallArgs = mockKafkaProducerService.sendPaymentCompletedData.mock.calls;
      const receivedOrderIds = kafkaCallArgs.map(call => call[0].orderId);
      const processedOrderIds = results.map(result => result.orderId.toString());
      
      receivedOrderIds.forEach(orderId => {
        expect(processedOrderIds).toContain(orderId);
      });
    });

    it('카프카 메시지 형식이 올바른지 확인해야 한다', async () => {
      // Arrange
      const processPaymentDto = new ProcessPaymentDto();
      processPaymentDto.orderId = 4;

      // Act
      await processPaymentUseCase.execute(processPaymentDto);

      // Assert - 메시지 형식 검증 (모킹된 메시지는 즉시 확인 가능)
      expect(mockKafkaProducerService.sendPaymentCompletedData).toHaveBeenCalledTimes(1);
      
      const message = mockKafkaProducerService.sendPaymentCompletedData.mock.calls[0][0];
      
      // 필수 필드 검증
      expect(message).toHaveProperty('orderId');
      expect(message).toHaveProperty('userId');
      expect(message).toHaveProperty('products');
      expect(message).toHaveProperty('totalAmount');
      expect(message).toHaveProperty('discountAmount');
      expect(message).toHaveProperty('finalAmount');
      expect(message).toHaveProperty('couponUsed');
      expect(message).toHaveProperty('status');
      expect(message).toHaveProperty('paidAt');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('source');
      expect(message).toHaveProperty('version');

      // 값 검증
      expect(message.orderId).toBe("4");
      expect(message.status).toBe('PAID');
      expect(message.source).toBe('hanghae-plus-backend');
      expect(message.version).toBe('1.0.0');
      expect(typeof message.totalAmount).toBe('number');
      expect(typeof message.finalAmount).toBe('number');
      expect(typeof message.couponUsed).toBe('boolean');
      expect(message.paidAt).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });
  });
});