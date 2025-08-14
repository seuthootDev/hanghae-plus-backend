import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 커스텀 메트릭 정의
const cacheInvalidationSuccess = new Rate('cache_invalidation_success');
const cacheInvalidationFailure = new Rate('cache_invalidation_failure');
const responseTimeAfterInvalidation = new Trend('response_time_after_invalidation');

// 테스트 설정
export const options = {
  stages: [
    // 워밍업 단계
    { duration: '30s', target: 10 },
    // 캐시 무효화 테스트
    { duration: '3m', target: 30 },
    // 정리 단계
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% 요청이 1초 이내
    http_req_failed: ['rate<0.05'],    // 에러율 5% 미만
    cache_invalidation_success: ['rate>0.9'], // 캐시 무효화 성공율 90% 이상
  },
};

// 테스트 시나리오
export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost:3000';
  
  // 1. 초기 캐시 상태 확인 (빠른 응답)
  const initialProductsResponse = http.get(`${baseUrl}/products`);
  const initialTopSellersResponse = http.get(`${baseUrl}/products/top-sellers`);
  
  check(initialProductsResponse, {
    '초기 상품 목록 조회 성공': (r) => r.status === 200,
    '초기 응답 시간 < 100ms': (r) => r.timings.duration < 100,
  });
  
  check(initialTopSellersResponse, {
    '초기 인기 상품 조회 성공': (r) => r.status === 200,
    '초기 응답 시간 < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(2);
  
  // 2. 상품 정보 변경 (캐시 무효화 트리거)
  const productUpdateData = {
    name: `Updated Product ${Date.now()}`,
    price: Math.floor(Math.random() * 10000) + 1000,
    stock: Math.floor(Math.random() * 100) + 10,
    category: 'Updated Category'
  };
  
  const updateResponse = http.put(`${baseUrl}/products/1`, JSON.stringify(productUpdateData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (check(updateResponse, {
    '상품 업데이트 성공': (r) => r.status === 200,
  })) {
    cacheInvalidationSuccess.add(1);
  } else {
    cacheInvalidationFailure.add(1);
  }
  
  sleep(1);
  
  // 3. 캐시 무효화 후 응답 시간 측정 (느린 응답 예상)
  const afterUpdateProductsResponse = http.get(`${baseUrl}/products`);
  const afterUpdateTopSellersResponse = http.get(`${baseUrl}/products/top-sellers`);
  
  if (check(afterUpdateProductsResponse, {
    '업데이트 후 상품 목록 조회 성공': (r) => r.status === 200,
  })) {
    responseTimeAfterInvalidation.add(afterUpdateProductsResponse.timings.duration);
  }
  
  if (check(afterUpdateTopSellersResponse, {
    '업데이트 후 인기 상품 조회 성공': (r) => r.status === 200,
  })) {
    responseTimeAfterInvalidation.add(afterUpdateTopSellersResponse.timings.duration);
  }
  
  sleep(2);
  
  // 4. 두 번째 조회 (캐시 재구축 후 빠른 응답)
  const secondProductsResponse = http.get(`${baseUrl}/products`);
  const secondTopSellersResponse = http.get(`${baseUrl}/products/top-sellers`);
  
  check(secondProductsResponse, {
    '두 번째 상품 목록 조회 성공': (r) => r.status === 200,
    '캐시 재구축 후 응답 시간 < 100ms': (r) => r.timings.duration < 100,
  });
  
  check(secondTopSellersResponse, {
    '두 번째 인기 상품 조회 성공': (r) => r.status === 200,
    '캐시 재구축 후 응답 시간 < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}

// 테스트 완료 후 요약 출력
export function handleSummary(data) {
  console.log('🔄 캐시 무효화 성능 테스트 결과 요약');
  console.log('====================================');
  
  // 캐시 무효화 성공율
  const invalidationSuccess = data.metrics.cache_invalidation_success.values.rate * 100;
  const invalidationFailure = data.metrics.cache_invalidation_failure.values.rate * 100;
  
  console.log(`캐시 무효화 성공율: ${invalidationSuccess.toFixed(1)}%`);
  console.log(`캐시 무효화 실패율: ${invalidationFailure.toFixed(1)}%`);
  
  // 응답 시간 변화
  if (data.metrics.response_time_after_invalidation.values.count > 0) {
    const avgAfterInvalidation = data.metrics.response_time_after_invalidation.values.avg;
    console.log(`캐시 무효화 후 평균 응답 시간: ${avgAfterInvalidation.toFixed(2)}ms`);
  }
  
  return {
    'cache-invalidation-summary.json': JSON.stringify(data, null, 2),
  };
}

