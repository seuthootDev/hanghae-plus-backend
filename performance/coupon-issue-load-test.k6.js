import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 커스텀 메트릭 정의
const couponIssueSuccess = new Rate('coupon_issue_success');
const couponIssueFailure = new Rate('coupon_issue_failure');
const couponIssueResponseTime = new Trend('coupon_issue_response_time');
const couponIssueErrors = new Counter('coupon_issue_errors');
const couponStockExhausted = new Counter('coupon_stock_exhausted');

// 테스트 설정
export const options = {
  stages: [
    // 워밍업 단계 (30초)
    { duration: '30s', target: 10 },
    // 점진적 부하 증가 (2분)
    { duration: '2m', target: 50 },
    // 선착순 쿠폰 발급 피크 부하 (3분) - 동시에 많은 사용자가 쿠폰 발급 시도
    { duration: '3m', target: 200 },
    // 부하 유지 (2분)
    { duration: '2m', target: 200 },
    // 부하 감소 (1분)
    { duration: '1m', target: 50 },
    // 정리 단계 (30초)
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% 요청이 1초 이내
    http_req_failed: ['rate<0.1'],     // HTTP 에러율 10% 미만 (쿠폰 소진으로 인한 실패는 정상)
    coupon_issue_success: ['rate>0.01'], // 성공율 1% 이상 (선착순 쿠폰 특성상 낮은 성공율이 정상)
    coupon_issue_response_time: ['p(90)<500'], // 90% 요청이 500ms 이내
    coupon_issue_errors: ['count<100'], // 서버 에러 100회 미만
  },
};

// 쿠폰 타입 목록
const couponTypes = [
  'DISCOUNT_10PERCENT',
  'DISCOUNT_20PERCENT', 
  'FIXED_1000',
  'FIXED_2000',
];

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
  
  // 쿠폰 발급 요청
  const response = http.post(`${baseUrl}/api/coupons/issue`, JSON.stringify(couponIssueData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // 응답 시간 기록
  couponIssueResponseTime.add(response.timings.duration);
  
  // 응답 검증 (201 성공만 성공으로 처리)
  const success = check(response, {
    '쿠폰 발급 요청 성공': (r) => r.status === 201,
    '쿠폰 소진 응답': (r) => r.status === 400,
    '서버 응답 정상': (r) => r.status === 201 || r.status === 400,
    '응답 시간 < 1초': (r) => r.timings.duration < 1000,
    '응답 시간 < 500ms': (r) => r.timings.duration < 500,
    '응답 시간 < 200ms': (r) => r.timings.duration < 200,
  });
  
  // 응답 상태별 분류
  if (response.status === 201) {
    // 쿠폰 발급 성공
    couponIssueSuccess.add(1);
    
    // 성공 시 응답 데이터 검증
    const responseData = JSON.parse(response.body);
    check(responseData, {
      '쿠폰 ID 존재': (data) => data.couponId !== undefined,
      '사용자 ID 일치': (data) => data.userId === userId,
      '쿠폰 타입 일치': (data) => data.couponType === couponType,
      '할인율 존재': (data) => data.discountRate !== undefined,
      '만료일 존재': (data) => data.expiryDate !== undefined,
      '사용 여부 false': (data) => data.isUsed === false,
    });
  } else if (response.status === 400) {
    // 쿠폰 소진 - 정상적인 비즈니스 응답 (실패가 아님)
    couponStockExhausted.add(1);
  } else if (response.status >= 500) {
    // 서버 에러 - 진짜 실패
    couponIssueFailure.add(1);
    couponIssueErrors.add(1);
  } else {
    // 기타 에러 (401, 403, 404 등) - 실패
    couponIssueFailure.add(1);
  }
  
  // 요청 간 간격 (0.1-0.5초 랜덤)
  sleep(Math.random() * 0.4 + 0.1);
}

// 테스트 완료 후 요약 출력
export function handleSummary(data) {
  console.log('🎫 선착순 쿠폰 발급 부하테스트 결과 요약');
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
  const successRate = getMetricValue('coupon_issue_success', 'rate') * 100;
  const failureRate = getMetricValue('coupon_issue_failure', 'rate') * 100;
  const stockExhaustedCount = getMetricValue('coupon_stock_exhausted', 'count');
  const actualErrorCount = getMetricValue('coupon_issue_errors', 'count');
  
  // 카운터를 비율로 변환
  const stockExhaustedRate = totalRequests > 0 ? (stockExhaustedCount / totalRequests) * 100 : 0;
  const actualErrorRate = totalRequests > 0 ? (actualErrorCount / totalRequests) * 100 : 0;
  
  console.log(`총 요청 수: ${totalRequests}`);
  console.log(`성공율: ${successRate.toFixed(1)}%`);
  console.log(`실패율: ${failureRate.toFixed(1)}%`);
  console.log(`쿠폰 소진율: ${stockExhaustedRate.toFixed(1)}%`);
  console.log(`서버 에러율: ${actualErrorRate.toFixed(1)}%`);
  
  // 검증: 모든 비율의 합이 100%인지 확인
  const totalRate = successRate + failureRate + stockExhaustedRate;
  console.log(`\n📊 응답 분류 검증:`);
  console.log(`성공 + 실패 + 쿠폰소진 = ${totalRate.toFixed(1)}% (정상: 100%)`);
  
  // 응답 시간 통계
  const avgResponseTime = getMetricValue('coupon_issue_response_time', 'avg');
  const p90ResponseTime = getMetricValue('coupon_issue_response_time', 'p(90)');
  const p95ResponseTime = getMetricValue('coupon_issue_response_time', 'p(95)');
  
  console.log(`평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`90% 응답 시간: ${p90ResponseTime.toFixed(2)}ms`);
  console.log(`95% 응답 시간: ${p95ResponseTime.toFixed(2)}ms`);
  
  // 처리량 (RPS)
  const totalDuration = getMetricValue('iteration_duration', 'total');
  const rps = totalDuration > 0 ? totalRequests / (totalDuration / 1000) : 0;
  console.log(`평균 처리량: ${rps.toFixed(2)} RPS`);
  
  // 에러 분석
  console.log(`쿠폰 소진으로 인한 실패: ${stockExhaustedCount}회`);
  console.log(`서버 에러: ${actualErrorCount}회`);
  
  // 성능 평가
  console.log('\n📊 성능 평가');
  console.log('============');
  
  // 쿠폰 발급 성공율 평가 (선착순 쿠폰의 특성상 낮은 성공율이 정상)
  if (successRate >= 0.1) {
    console.log('✅ 쿠폰 발급 성공율: 양호 (0.1% 이상)');
  } else {
    console.log('❌ 쿠폰 발급 성공율: 개선 필요 (0.1% 미만)');
  }
  
  // 응답 시간 평가
  if (p95ResponseTime < 1000) {
    console.log('✅ 응답 시간: 양호 (95% < 1초)');
  } else {
    console.log('❌ 응답 시간: 개선 필요 (95% >= 1초)');
  }
  
  // 실제 서버 에러율 평가 (쿠폰 소진은 정상적인 비즈니스 로직)
  if (actualErrorRate < 1) {
    console.log('✅ 서버 에러율: 양호 (1% 미만)');
  } else {
    console.log('❌ 서버 에러율: 개선 필요 (1% 이상)');
  }
  
  // 쿠폰 소진률 평가 (선착순 쿠폰의 특성상 높은 소진률이 정상)
  if (stockExhaustedRate >= 90) {
    console.log('✅ 쿠폰 소진률: 정상 (90% 이상 - 선착순 특성)');
  } else {
    console.log('⚠️ 쿠폰 소진률: 낮음 (90% 미만 - 재고가 남아있음)');
  }
  
  // 전체 시스템 안정성 평가
  if (failureRate < 5) {
    console.log('✅ 시스템 안정성: 양호 (실패율 5% 미만)');
  } else {
    console.log('❌ 시스템 안정성: 개선 필요 (실패율 5% 이상)');
  }
  
  return {
    'coupon-issue-load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
