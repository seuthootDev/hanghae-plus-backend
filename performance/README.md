# Redis 캐시 성능 테스트 가이드

## 📋 개요

이 디렉토리는 k6를 사용하여 Redis 캐시의 성능을 테스트하고 검증하는 스크립트들을 포함합니다.

## 🚀 k6 설치

### Windows
```bash
# Chocolatey 사용
choco install k6

# 또는 직접 다운로드
# https://k6.io/docs/getting-started/installation/windows/
```

### macOS
```bash
# Homebrew 사용
brew install k6
```

### Linux
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 🧪 테스트 실행

### 1. 캐시 성능 테스트
```bash
# 기본 실행 (localhost:3000)
k6 run cache-performance.k6.js

# 커스텀 API URL로 실행
k6 run -e API_URL=http://your-api-url:3000 cache-performance.k6.js

# 결과를 JSON 파일로 저장
k6 run --out json=results/cache-performance.json cache-performance.k6.js
```

### 2. 캐시 무효화 테스트
```bash
# 기본 실행
k6 run cache-invalidation.k6.js

# 커스텀 API URL로 실행
k6 run -e API_URL=http://your-api-url:3000 cache-invalidation.k6.js

# 결과를 JSON 파일로 저장
k6 run --out json=results/cache-invalidation.json cache-invalidation.k6.js
```

## 📊 테스트 결과 해석

### 캐시 성능 테스트 지표

| 메트릭 | 설명 | 목표값 |
|--------|------|--------|
| `cache_hit_rate` | 캐시 히트율 | > 80% |
| `response_time_with_cache` | 캐시 히트 시 응답 시간 | < 50ms |
| `response_time_without_cache` | 캐시 미스 시 응답 시간 | < 200ms |
| `http_req_duration` | 전체 HTTP 요청 응답 시간 | p(95) < 500ms |

### 캐시 무효화 테스트 지표

| 메트릭 | 설명 | 목표값 |
|--------|------|--------|
| `cache_invalidation_success` | 캐시 무효화 성공율 | > 90% |
| `response_time_after_invalidation` | 무효화 후 응답 시간 | < 1000ms |

## 🔍 성능 개선 효과 측정

### 예상 결과

#### 캐시 히트 시
- **응답 시간**: 5-20ms
- **처리량**: 초당 1000-5000 요청
- **DB 부하**: 최소화

#### 캐시 미스 시
- **응답 시간**: 100-500ms
- **처리량**: 초당 100-500 요청
- **DB 부하**: 직접 조회

### 성능 개선율 계산
```
성능 개선율 = ((캐시 미스 응답시간 - 캐시 히트 응답시간) / 캐시 미스 응답시간) × 100%

예시: ((200ms - 15ms) / 200ms) × 100% = 92.5%
```

## 📈 테스트 시나리오

### 1. 워밍업 단계 (30초)
- 서버와 캐시 시스템 초기화
- 점진적으로 부하 증가

### 2. 캐시 없는 상태 테스트 (2분)
- 초기 요청으로 캐시 구축
- DB 직접 조회 성능 측정

### 3. 캐시 있는 상태 테스트 (2분)
- 캐시 히트 시 성능 측정
- 캐시 효과 검증

### 4. 피크 부하 테스트 (1분)
- 최대 부하 상황에서 성능 측정
- 시스템 안정성 검증

## 🛠️ 커스터마이징

### 환경 변수 설정
```bash
# API URL 설정
export API_URL=http://your-api-url:3000

# 테스트 지속 시간 조정
export TEST_DURATION=5m

# 동시 사용자 수 조정
export VUS=100
```

### 테스트 임계값 조정
```javascript
// cache-performance.k6.js에서
thresholds: {
  http_req_duration: ['p(95)<300'],  // 더 엄격한 기준
  cache_hit_rate: ['rate>0.9'],      // 90% 이상
}
```

## 📝 결과 분석

### 1. 응답 시간 분포
- **p50**: 중간값 (50% 요청이 이 시간 이내)
- **p90**: 90% 요청이 이 시간 이내
- **p95**: 95% 요청이 이 시간 이내

### 2. 처리량 (Throughput)
- **RPS**: 초당 요청 수
- **캐시 히트율**: 전체 요청 중 캐시에서 응답한 비율

### 3. 에러율
- **HTTP 에러**: 4xx, 5xx 응답 비율
- **타임아웃**: 응답 시간 초과 비율

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 연결 실패
```bash
# 방화벽 확인
# API 서버 상태 확인
# 네트워크 연결 확인
```

#### 2. 응답 시간 지연
```bash
# Redis 연결 상태 확인
# DB 성능 확인
# 서버 리소스 사용량 확인
```

#### 3. 캐시 히트율 저하
```bash
# TTL 설정 확인
# 캐시 무효화 로직 확인
# 메모리 사용량 확인
```

## 📞 지원

성능 테스트 관련 문의사항이 있으시면 개발팀에 연락해주세요.

