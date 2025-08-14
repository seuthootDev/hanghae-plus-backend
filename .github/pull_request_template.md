## :pushpin: PR 제목 규칙
[STEP11] 정승훈 - e-commerce

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
- [✔️] 동시성을 검증할 수 있는 테스트코드로 작성 되었는가?
- [✔️] Test Container 가 적용 되었는가?
- [`2d5eebf`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ae2dcea2e024abc2ffe8de3898540892d5eebf0576671b9f0474bce5dec6f36d7a5baa3a6c4309b7) [`08d2c95`](https://github.com/seuthootDev/hanghae-plus-backend/commit/08d2c95bcb382142b85fcf55cbc5de72d25132be)

#### :three: Cache 적용 (3개)
- [ ] 적절하게 Key 적용이 되었는가?

---
#### STEP11
- [✔️] Redis 분산락 적용
- [✔️] Test Container 구성
- [✔️] 기능별 통합 테스트

#### STEP12
- [ ] 캐시 필요한 부분 분석
- [ ] redis 기반의 캐시 적용
- [ ] 성능 개선 등을 포함한 보고서 제출

### **간단 회고** (3줄 이내)
- **잘한 점**: 테스트 컨테이너에서 레디스를 실제로 사용하는 지 검증
- **어려운 점**: 쿠폰 재고 테이블이 없어서 하드코딩 하는 방식으로 진행했는데 아무래도 작성하는게 좋을것 같음
- **다음 시도**: 스핀락을 펍섭으로 리팩토링해보기, 프리스마, 마이크로orm으로 리팩토링 해보기


### 분산락 키 설정 및 동시성 제어 방식

#### 🔒 쿠폰 발급 (PessimisticLock)
- **키**: `coupon:issue:user:${userId}`
- **이유**: 
  - 초기에는 `coupon:issue:${couponType}`으로 설정했으나, 쿠폰 타입별로 락이 걸려 한 번에 한 명의 사용자만 쿠폰을 발급받을 수 있어 타임아웃 이슈 발생
  - 사용자별 락으로 변경하여 다른 사용자들은 동시에 쿠폰을 발급받을 수 있도록 개선
  - **Redis 원자적 연산 추가**: `decr` 명령어로 트랜잭션 이전에 재고를 원자적으로 감소시켜 Race Condition 완전 방지

#### 🛒 주문 생성 (OptimisticLock)
- **키**: `order:create:${userId}:${itemKeys}`
- **이유**: 
  - 동일 사용자가 같은 상품을 동시에 주문하는 것을 방지
  - 상품 ID와 수량을 포함하여 구체적인 주문 내용에 대한 중복 방지

#### 💳 결제 처리 (OptimisticLock)
- **키**: `payment:process:${orderId}`
- **이유**: 
  - 하나의 주문을 여러 번 결제하는 것을 방지
  - 주문 ID 기반으로 해당 주문에 대한 중복 결제 차단

#### 👤 회원가입 (OptimisticLock)
- **키**: `register:${email}`
- **이유**: 
  - 동일 이메일로 중복 가입하는 것을 방지
  - 이메일 기반으로 사용자별 중복 가입 차단

#### 🏪 상품 재고 관리 (DB PessimisticLock)
- **키**: `coupons` 테이블의 `id` 컬럼
- **이유**: 
  - 쿠폰 저장 시 DB 레벨에서 동시성 제어
  - `FOR UPDATE` 락으로 쿠폰 발급 과정의 데이터 정합성 보장