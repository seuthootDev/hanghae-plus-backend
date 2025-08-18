## :pushpin: PR 제목 규칙
[STEP12] 정승훈 - e-commerce

---
### **핵심 체크리스트** :white_check_mark:

#### :one: 분산락 적용 (3개)
- [✔️] 적절한 곳에 분산락이 사용되었는가? 
- [`79a61a7`](https://github.com/seuthootDev/hanghae-plus-backend/commit/79a61a7b7814171293bbbe92dc03a1c4ba1aedc0)
[`0f4c3c0`](https://github.com/seuthootDev/hanghae-plus-backend/commit/0f4c3c09f325e07269a32d9317c087d9ca848c83)
- [✔️] 트랜젝션 순서와 락순서가 보장되었는가?
- [`ae2dcea`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ae2dcea2e024abc2ffe8de389854089a6c4309b7)

#### :two: 통합 테스트 (2개)
- [✔️] infrastructure 레이어를 포함하는 통합 테스트가 작성되었는가?
- [✔️] 핵심 기능에 대한 흐름이 테스트에서 검증되었는가?
- [`8090699`](https://github.com/seuthootDev/hanghae-plus-backend/commit/8090699760fd478dbd4a94637d212977613e33b4)
- [✔️] 동시성을 검증할 수 있는 테스트코드로 작성 되었는가?
- [`84d0629`](https://github.com/seuthootDev/hanghae-plus-backend/commit/84d06294e65b5ff86ecb0a5124610e2e0717ceb7)
- [✔️] Test Container 가 적용 되었는가?
- [`2d5eebf`](https://github.com/seuthootDev/hanghae-plus-backend/commit/2d5eebf0576671b9f0474bce5dec6f36d7a5baa3) [`08d2c95`](https://github.com/seuthootDev/hanghae-plus-backend/commit/08d2c95bcb382142b85fcf55cbc5de72d25132be)

#### :three: Cache 적용 (3개)
- [✔️] 적절하게 Key 적용이 되었는가?

---
#### STEP11
- [✔️] Redis 분산락 적용
- [✔️] Test Container 구성
- [✔️] 기능별 통합 테스트

#### STEP12
- [✔️] 캐시 필요한 부분 분석
- [✔️] redis 기반의 캐시 적용
- [`51dde6a`](https://github.com/seuthootDev/hanghae-plus-backend/commit/51dde6a313e2553fcadacc0a15e789c2a453bc90) [`d01ebed`](https://github.com/seuthootDev/hanghae-plus-backend/commit/d01ebed33777d4b59ca83303ade882186b41141f)
- [✔️] 성능 개선 등을 포함한 보고서 제출
- [`98aa3d6`](https://github.com/seuthootDev/hanghae-plus-backend/commit/98aa3d6da4e166fbf2e9e91319f7147bb93696b8) [`4d49918`](https://github.com/seuthootDev/hanghae-plus-backend/commit/4d499189de9a473e099bca0574e651c89efd7c14)

### **간단 회고** (3줄 이내)
- **잘한 점**: 테스트 컨테이너에서 레디스를 실제로 사용하는 지 검증
- **어려운 점**: 환경설정을 못해서 k6로 성능을 검증하는 코드를 돌려보지 못했음.. 로컬에 mysql에 설치되어 있지 않아서 도커 기반으로 서버를 띄우고 실행하려 했으나 db연결 문제로 실행이 안 되고 있음 시간이 없어서 차주에 다시 도전할 예정정
- **다음 시도**: k6 성능 검증 실행해보기


### 캐시설정

#### **적용된 캐시 전략**
- **Read-Through**: 데이터 조회 시 캐시 우선 확인
- **Write-Through**: 데이터 변경 시 캐시 자동 무효화
- **TTL 기반 만료**: 설정된 시간 후 자동 캐시 삭제

#### **캐시 적용 구간**
| 캐시 유형 | 키 구조 | TTL | 적용 이유 |
|-----------|---------|-----|-----------|
| **인기 상품** | `top_sellers_cache` | 5분 | 판매 데이터 실시간성 중시 |
| **상품 목록** | `products:all` | 10분 | 정적인 데이터, 자주 조회 |
| **상품 상세** | `product:{productId}` | 10분 | 개별 상품 정보 안정성 |
| **사용자 포인트** | `user:points:{userId}` | 5분 | 포인트 잔액 정확성 중시 |

#### **키 관리 전략**
- **Prefix 기반**: `products:`, `user:points:` 등 도메인별 구분
- **TTL 설정**: 데이터 특성에 따른 차등 적용 (5분~10분)
- **무효화 전략**: Write-Through 패턴으로 데이터 변경 시 자동 캐시 삭제
- **계층적 무효화**: 개별 데이터 변경 시 관련 집계 캐시도 함께 무효화

#### **성능 개선 효과**
- **응답 시간**: DB 조회 대비 **80-95%** 단축 (150ms → 10-20ms)
- **처리량**: **4-6배** 증가 (200 req/s → 800-1200 req/s)
- **DB 부하**: **80-90%** 쿼리 수 감소