import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DataPlatformService {
  private readonly logger = new Logger(DataPlatformService.name);

  /**
   * 외부 데이터 플랫폼으로 주문 정보 전송 (Mock API)
   */
  async sendOrderData(orderData: any): Promise<void> {
    try {
      this.logger.log(`📤 데이터 플랫폼 전송 시작: 주문 ${orderData.orderId}`);
      
      // Mock API 호출 시뮬레이션
      const mockApiUrl = 'https://api.dataplatform.com/orders';
      const mockApiKey = 'mock-api-key-12345';
      
      // 실제 fetch 호출 (Mock 환경에서는 성공으로 처리)
      const response = await this.mockApiCall(mockApiUrl, orderData, mockApiKey);
      
      if (response.success) {
        this.logger.log(`✅ 데이터 플랫폼 전송 성공: 주문 ${orderData.orderId}`);
      } else {
        throw new Error(`API 응답 실패: ${response.message}`);
      }
    } catch (error) {
      this.logger.error(`❌ 데이터 플랫폼 전송 실패: 주문 ${orderData.orderId}`, error);
      throw new Error(`데이터 플랫폼 전송 실패: ${error.message}`);
    }
  }

  /**
   * Mock API 호출 (실제 환경에서는 실제 fetch 사용)
   */
  private async mockApiCall(url: string, data: any, apiKey: string): Promise<any> {
    // 실제 환경에서는 이 부분을 실제 fetch로 교체
    // const response = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify(data)
    // });
    
    // Mock 응답 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 지연
    
    // 95% 성공률로 Mock 응답
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      return {
        success: true,
        message: 'Order data sent successfully',
        orderId: data.orderId,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: 'Mock API temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      };
    }
  }
}
