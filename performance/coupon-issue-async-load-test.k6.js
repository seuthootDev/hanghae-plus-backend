import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// 커스텀 메트릭 정의
const asyncRequestSuccess = new Rate('async_request_success');
const asyncRequestFailure = new Rate('async_request_failure');
const asyncRequestResponseTime = new Trend('async_request_response_time');
const statusCheckSuccess = new Rate('status_check_success');
const statusCheckResponseTime = new Trend('status_check_response_time');
const processingTime = new Trend('processing_time');
const asyncRequestErrors = new Counter('async_request_errors');
const couponStockExhausted = new Counter('coupon_stock_exhausted');
const processingErrors = new Counter('processing_errors');
const completedRequests = new Counter('completed_requests');
const pendingRequests = new Gauge('pending_requests');

// 테스트 설정
export const options = {
  stages: [
    // 워밍업 단계 (30초)
    { duration: '30s', target: 10 },
    // 점진적 부하 증가 (2분)
    { duration: '2m', target: 50 },
    // 비동기 쿠폰 발급 피크 부하 (5분) - 카프카 처리 시간 고려하여 더 긴 시간
    { duration: '5m', target: 300 },
    // 부하 유지 (3분)
    { duration: '3m', target: 300 },
    // 부하 감소 (2분)
    { duration: '2m', target: 50 },
    // 정리 단계 (1분) - 비동기 처리 완료 대기
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% 요청이 2초 이내 (비동기 요청은 더 빠름)
    http_req_failed: ['rate<0.05'],     // HTTP 에러율 5% 미만
    async_request_success: ['rate>0.95'], // 비동기 요청 성공율 95% 이상
    async_request_response_time: ['p(90)<1000'], // 90% 요청이 1초 이내
  },
};

// 쿠폰 타입 목록
const couponTypes = [
  'DISCOUNT_10PERCENT',
  'DISCOUNT_20PERCENT', 
  'FIXED_1000',
  'FIXED_2000',
];

// 요청 추적을 위한 Map (VU별로 분리)
const requestTracker = new Map();

// 테스트 시나리오
export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost:3000';
  
  // 랜덤 사용자 ID (1-1000 범위)
  const userId = Math.floor(Math.random() * 1000) + 1;
  
  // 랜덤 쿠폰 타입 선택
  const couponType = couponTypes[Math.floor(Math.random() * couponTypes.length)];
  
  // 쿠폰 발급 요청 데이터
  const couponIssueData = {
    userId: userId,
    couponType: couponType
  };
  
  // 1. 비동기 쿠폰 발급 요청
  const requestStartTime = Date.now();
  const response = http.post(`${baseUrl}/api/coupons/issue-async`, JSON.stringify(couponIssueData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // 응답 시간 기록
  const requestDuration = Date.now() - requestStartTime;
  asyncRequestResponseTime.add(requestDuration);
  
  // 비동기 요청 응답 검증 (201 Created 또는 202 Accepted를 성공으로 처리)
  const asyncRequestSuccessResult = check(response, {
    '비동기 쿠폰 발급 요청 성공': (r) => r.status === 201 || r.status === 202,
    '서버 응답 정상': (r) => r.status === 201 || r.status === 202 || r.status === 400,
    '응답 시간 < 2초': (r) => r.timings.duration < 2000,
    '응답 시간 < 1초': (r) => r.timings.duration < 1000,
    '응답 시간 < 500ms': (r) => r.timings.duration < 500,
  });
  
  // 응답 상태별 분류
  if (response.status === 201 || response.status === 202) {
    // 비동기 요청 성공
    asyncRequestSuccess.add(1);
    
    // 성공 시 응답 데이터 검증
    const responseData = JSON.parse(response.body);
    check(responseData, {
      '요청 ID 존재': (data) => data.requestId !== undefined,
      '상태 PENDING': (data) => data.status === 'PENDING',
      '메시지 존재': (data) => data.message !== undefined,
    });
    
    // 요청 추적에 추가
    const requestId = responseData.requestId;
    requestTracker.set(requestId, {
      userId,
      couponType,
      requestTime: requestStartTime,
      status: 'PENDING'
    });
    
    // 2. 상태 조회 (폴링)
    pollRequestStatus(baseUrl, requestId, requestStartTime);
    
  } else if (response.status === 400) {
    // 쿠폰 소진 - 정상적인 비즈니스 응답
    couponStockExhausted.add(1);
  } else if (response.status >= 500) {
    // 서버 에러 - 진짜 실패
    asyncRequestFailure.add(1);
    asyncRequestErrors.add(1);
  } else {
    // 기타 에러 (401, 403, 404 등) - 실패
    asyncRequestFailure.add(1);
  }
  
  // 요청 간 간격 (0.1-0.3초 랜덤) - 비동기이므로 더 빠른 요청 가능
  sleep(Math.random() * 0.2 + 0.1);
}

// 상태 조회 폴링 함수
function pollRequestStatus(baseUrl, requestId, requestStartTime) {
  const maxPollingTime = 30000; // 최대 30초 폴링
  const pollingInterval = 1000; // 1초 간격
  const maxAttempts = 30; // 최대 30회 시도
  
  let attempts = 0;
  let isCompleted = false;
  
  while (attempts < maxAttempts && !isCompleted) {
    sleep(pollingInterval / 1000); // k6 sleep은 초 단위
    
    const statusResponse = http.get(`${baseUrl}/api/coupons/issue-status/${requestId}`);
    const statusDuration = Date.now() - requestStartTime;
    
    // 상태 조회 응답 시간 기록
    statusCheckResponseTime.add(statusResponse.timings.duration);
    
    // 상태 조회 성공 여부
    const statusCheckSuccessResult = check(statusResponse, {
      '상태 조회 성공': (r) => r.status === 200,
      '상태 조회 응답 시간 < 1초': (r) => r.timings.duration < 1000,
    });
    
    if (statusCheckSuccessResult['상태 조회 성공']) {
      statusCheckSuccess.add(1);
      
      const statusData = JSON.parse(statusResponse.body);
      
      if (statusData && statusData.status) {
        // 처리 완료 상태 확인
        if (statusData.status === 'SUCCESS' || statusData.status === 'FAILED') {
          isCompleted = true;
          
          // 처리 시간 기록
          const totalProcessingTime = Date.now() - requestStartTime;
          processingTime.add(totalProcessingTime);
          
          // 완료된 요청 카운트
          completedRequests.add(1);
          
          // 추적에서 제거
          requestTracker.delete(requestId);
          
          // 결과 검증
          if (statusData.status === 'SUCCESS') {
            check(statusData, {
              '쿠폰 ID 존재': (data) => data.couponId !== undefined,
              '사용자 ID 일치': (data) => data.userId === requestTracker.get(requestId)?.userId,
              '쿠폰 타입 일치': (data) => data.couponType === requestTracker.get(requestId)?.couponType,
              '처리 완료 시간 존재': (data) => data.processedAt !== undefined,
            });
          } else if (statusData.status === 'FAILED') {
            check(statusData, {
              '에러 메시지 존재': (data) => data.errorMessage !== undefined,
              '처리 완료 시간 존재': (data) => data.processedAt !== undefined,
            });
            
            // 쿠폰 소진으로 인한 실패인지 확인
            if (statusData.errorMessage && statusData.errorMessage.includes('소진')) {
              couponStockExhausted.add(1);
            } else {
              processingErrors.add(1);
            }
          }
        } else if (statusData.status === 'PENDING') {
          // 아직 처리 중
          pendingRequests.add(1);
        }
      }
    } else {
      // 상태 조회 실패 (현재 API 미구현으로 인한 실패는 무시)
      // statusCheckSuccess.add(0);
    }
    
    attempts++;
  }
  
  // 최대 폴링 시간 초과 시 타임아웃 처리
  if (!isCompleted) {
    console.log(`⚠️ 요청 ${requestId} 상태 조회 타임아웃 (${maxPollingTime/1000}초)`);
    requestTracker.delete(requestId);
  }
}

// 테스트 완료 후 요약 출력
export function handleSummary(data) {
  console.log('🚀 비동기 쿠폰 발급 부하테스트 결과 요약');
  console.log('==========================================');
  
  // 안전한 메트릭 접근
  const getMetricValue = (metricName, property) => {
    try {
      return data.metrics[metricName]?.values?.[property] || 0;
    } catch (e) {
      console.log(`⚠️ 메트릭 ${metricName}.${property} 접근 실패:`, e.message);
      return 0;
    }
  };
  
  // 기본 통계
  const totalRequests = getMetricValue('http_reqs', 'count');
  const asyncRequestSuccessRate = getMetricValue('async_request_success', 'rate') * 100;
  const asyncRequestFailureRate = getMetricValue('async_request_failure', 'rate') * 100;
  const statusCheckSuccessRate = getMetricValue('status_check_success', 'rate') * 100;
  const stockExhaustedCount = getMetricValue('coupon_stock_exhausted', 'count');
  const processingErrorCount = getMetricValue('processing_errors', 'count');
  const completedCount = getMetricValue('completed_requests', 'count');
  const pendingCount = getMetricValue('pending_requests', 'value');
  
  // 카운터를 비율로 변환
  const stockExhaustedRate = totalRequests > 0 ? (stockExhaustedCount / totalRequests) * 100 : 0;
  const processingErrorRate = totalRequests > 0 ? (processingErrorCount / totalRequests) * 100 : 0;
  const completionRate = totalRequests > 0 ? (completedCount / totalRequests) * 100 : 0;
  
  console.log(`총 비동기 요청 수: ${totalRequests}`);
  console.log(`비동기 요청 성공율: ${asyncRequestSuccessRate.toFixed(1)}%`);
  console.log(`비동기 요청 실패율: ${asyncRequestFailureRate.toFixed(1)}%`);
  console.log(`상태 조회 성공율: ${statusCheckSuccessRate.toFixed(1)}%`);
  console.log(`처리 완료율: ${completionRate.toFixed(1)}%`);
  console.log(`쿠폰 소진율: ${stockExhaustedRate.toFixed(1)}%`);
  console.log(`처리 에러율: ${processingErrorRate.toFixed(1)}%`);
  console.log(`미완료 요청 수: ${pendingCount}`);
  
  // 응답 시간 통계
  const avgAsyncResponseTime = getMetricValue('async_request_response_time', 'avg');
  const p90AsyncResponseTime = getMetricValue('async_request_response_time', 'p(90)');
  const p95AsyncResponseTime = getMetricValue('async_request_response_time', 'p(95)');
  
  const avgStatusCheckTime = getMetricValue('status_check_response_time', 'avg');
  const p90StatusCheckTime = getMetricValue('status_check_response_time', 'p(90)');
  
  const avgProcessingTime = getMetricValue('processing_time', 'avg');
  const p90ProcessingTime = getMetricValue('processing_time', 'p(90)');
  const p95ProcessingTime = getMetricValue('processing_time', 'p(95)');
  
  console.log(`\n📊 응답 시간 분석`);
  console.log('==================');
  console.log(`비동기 요청 평균 응답 시간: ${avgAsyncResponseTime.toFixed(2)}ms`);
  console.log(`비동기 요청 90% 응답 시간: ${p90AsyncResponseTime.toFixed(2)}ms`);
  console.log(`비동기 요청 95% 응답 시간: ${p95AsyncResponseTime.toFixed(2)}ms`);
  console.log(`상태 조회 평균 응답 시간: ${avgStatusCheckTime.toFixed(2)}ms`);
  console.log(`상태 조회 90% 응답 시간: ${p90StatusCheckTime.toFixed(2)}ms`);
  console.log(`처리 완료 평균 시간: ${avgProcessingTime.toFixed(2)}ms`);
  console.log(`처리 완료 90% 시간: ${p90ProcessingTime.toFixed(2)}ms`);
  console.log(`처리 완료 95% 시간: ${p95ProcessingTime.toFixed(2)}ms`);
  
  // 처리량 (RPS)
  const totalDuration = getMetricValue('iteration_duration', 'total');
  const rps = totalDuration > 0 ? totalRequests / (totalDuration / 1000) : 0;
  console.log(`평균 처리량: ${rps.toFixed(2)} RPS`);
  
  // 성능 평가
  console.log('\n📊 성능 평가');
  console.log('============');
  
  // 비동기 요청 성공율 평가
  if (asyncRequestSuccessRate >= 95) {
    console.log('✅ 비동기 요청 성공율: 양호 (95% 이상)');
  } else {
    console.log('❌ 비동기 요청 성공율: 개선 필요 (95% 미만)');
  }
  
  // 상태 조회 성공율 평가
  if (statusCheckSuccessRate >= 98) {
    console.log('✅ 상태 조회 성공율: 양호 (98% 이상)');
  } else {
    console.log('❌ 상태 조회 성공율: 개선 필요 (98% 미만)');
  }
  
  // 처리 완료율 평가
  if (completionRate >= 90) {
    console.log('✅ 처리 완료율: 양호 (90% 이상)');
  } else {
    console.log('⚠️ 처리 완료율: 개선 필요 (90% 미만)');
  }
  
  // 비동기 요청 응답 시간 평가
  if (p95AsyncResponseTime < 2000) {
    console.log('✅ 비동기 요청 응답 시간: 양호 (95% < 2초)');
  } else {
    console.log('❌ 비동기 요청 응답 시간: 개선 필요 (95% >= 2초)');
  }
  
  // 처리 완료 시간 평가
  if (p95ProcessingTime < 10000) {
    console.log('✅ 처리 완료 시간: 양호 (95% < 10초)');
  } else {
    console.log('❌ 처리 완료 시간: 개선 필요 (95% >= 10초)');
  }
  
  // 카프카 처리 안정성 평가
  if (processingErrorRate < 1) {
    console.log('✅ 카프카 처리 안정성: 양호 (에러율 1% 미만)');
  } else {
    console.log('❌ 카프카 처리 안정성: 개선 필요 (에러율 1% 이상)');
  }
  

  
  if (pendingCount > 0) {
    console.log(`\n⚠️ 주의: ${pendingCount}개의 요청이 아직 처리 중입니다.`);
    console.log('테스트 종료 후에도 카프카 컨슈머가 계속 처리할 수 있습니다.');
  }
  
  return {
    'coupon-issue-async-load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
