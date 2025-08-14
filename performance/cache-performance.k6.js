import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 커스텀 메트릭 정의
const cacheHitRate = new Rate('cache_hit_rate');
const cacheMissRate = new Rate('cache_miss_rate');
const responseTimeWithCache = new Trend('response_time_with_cache');
const responseTimeWithoutCache = new Trend('response_time_without_cache');

// 테스트 설정
export const options = {
  stages: [
    // 워밍업 단계
    { duration: '30s', target: 10 },
    // 캐시 없는 상태 테스트 (DB 직접 조회)
    { duration: '2m', target: 50 },
    // 캐시 있는 상태 테스트
    { duration: '2m', target: 100 },
    // 피크 부하 테스트
    { duration: '1m', target: 200 },
    // 정리 단계
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 요청이 500ms 이내
    http_req_failed: ['rate<0.01'],   // 에러율 1% 미만
    cache_hit_rate: ['rate>0.8'],     // 캐시 히트율 80% 이상
  },
};

// 테스트 시나리오
export default function () {
  const baseUrl = __ENV.API_URL || 'http://localhost:3000';
  
  // 1. 상품 목록 조회 (캐시 성능 테스트)
  const productsResponse = http.get(`${baseUrl}/products`);
  
  if (check(productsResponse, {
    '상품 목록 조회 성공': (r) => r.status === 200,
    '응답 시간 < 100ms': (r) => r.timings.duration < 100,
  })) {
    // 캐시 히트 여부 판단 (응답 시간으로 추정)
    if (productsResponse.timings.duration < 50) {
      cacheHitRate.add(1);
      responseTimeWithCache.add(productsResponse.timings.duration);
    } else {
      cacheMissRate.add(1);
      responseTimeWithoutCache.add(productsResponse.timings.duration);
    }
  }

  // 2. 인기 상품 조회 (캐시 성능 테스트)
  const topSellersResponse = http.get(`${baseUrl}/products/top-sellers`);
  
  if (check(topSellersResponse, {
    '인기 상품 조회 성공': (r) => r.status === 200,
    '응답 시간 < 100ms': (r) => r.timings.duration < 100,
  })) {
    if (topSellersResponse.timings.duration < 50) {
      cacheHitRate.add(1);
      responseTimeWithCache.add(topSellersResponse.timings.duration);
    } else {
      cacheMissRate.add(1);
      responseTimeWithoutCache.add(topSellersResponse.timings.duration);
    }
  }

  // 3. 사용자 포인트 조회 (캐시 성능 테스트)
  const userId = Math.floor(Math.random() * 5) + 1; // 1-5번 사용자
  const pointsResponse = http.get(`${baseUrl}/users/${userId}/points`);
  
  if (check(pointsResponse, {
    '포인트 조회 성공': (r) => r.status === 200,
    '응답 시간 < 100ms': (r) => r.timings.duration < 100,
  })) {
    if (pointsResponse.timings.duration < 50) {
      cacheHitRate.add(1);
      responseTimeWithCache.add(pointsResponse.timings.duration);
    } else {
      cacheMissRate.add(1);
      responseTimeWithoutCache.add(pointsResponse.timings.duration);
    }
  }

  // 4. 상품 상세 조회 (캐시 성능 테스트)
  const productId = Math.floor(Math.random() * 5) + 1; // 1-5번 상품
  const productDetailResponse = http.get(`${baseUrl}/products/${productId}`);
  
  if (check(productDetailResponse, {
    '상품 상세 조회 성공': (r) => r.status === 200,
    '응답 시간 < 100ms': (r) => r.timings.duration < 100,
  })) {
    if (productDetailResponse.timings.duration < 50) {
      cacheHitRate.add(1);
      responseTimeWithCache.add(productDetailResponse.timings.duration);
    } else {
      cacheMissRate.add(1);
      responseTimeWithoutCache.add(productDetailResponse.timings.duration);
    }
  }

  // 요청 간 간격
  sleep(1);
}

// 테스트 완료 후 요약 출력
export function handleSummary(data) {
  console.log('📊 캐시 성능 테스트 결과 요약');
  console.log('================================');
  
  // 캐시 히트율 계산
  const totalRequests = data.metrics.http_reqs.values.count;
  const cacheHits = data.metrics.cache_hit_rate.values.rate * totalRequests;
  const cacheMisses = data.metrics.cache_miss_rate.values.rate * totalRequests;
  
  console.log(`총 요청 수: ${totalRequests}`);
  console.log(`캐시 히트: ${Math.round(cacheHits)} (${(data.metrics.cache_hit_rate.values.rate * 100).toFixed(1)}%)`);
  console.log(`캐시 미스: ${Math.round(cacheMisses)} (${(data.metrics.cache_miss_rate.values.rate * 100).toFixed(1)}%)`);
  
  // 응답 시간 비교
  if (data.metrics.response_time_with_cache.values.count > 0) {
    const avgWithCache = data.metrics.response_time_with_cache.values.avg;
    console.log(`캐시 히트 시 평균 응답 시간: ${avgWithCache.toFixed(2)}ms`);
  }
  
  if (data.metrics.response_time_without_cache.values.count > 0) {
    const avgWithoutCache = data.metrics.response_time_without_cache.values.avg;
    console.log(`캐시 미스 시 평균 응답 시간: ${avgWithoutCache.toFixed(2)}ms`);
    
    if (data.metrics.response_time_with_cache.values.count > 0) {
      const improvement = ((avgWithoutCache - avgWithCache) / avgWithoutCache * 100).toFixed(1);
      console.log(`성능 개선율: ${improvement}%`);
    }
  }
  
  return {
    'cache-performance-summary.json': JSON.stringify(data, null, 2),
  };
}

