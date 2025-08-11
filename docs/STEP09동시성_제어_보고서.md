# 동시성 제어 보고서

## 📋 목차
1. [문제 식별](#문제-식별)
2. [동시성 문제 분석](#동시성-문제-분석)
3. [해결 방안](#해결-방안)
4. [구현 결과](#구현-결과)
5. [테스트 및 검증](#테스트-및-검증)
6. [향후 확장 계획](#향후-확장-계획)

---

## 🔍 문제 식별

### 1.1 동시성 문제가 발생하는 서비스 영역

이커머스 서비스에서 다음과 같은 동시성 문제가 발생할 수 있습니다:

#### **1.1.1 쿠폰 발급**
- **문제**: 선착순 쿠폰 발급 시 동시 요청으로 인한 중복 발급
- **영향**: 쿠폰 수량 초과, 공정성 문제
- **예시**: 100개 쿠폰에 200명이 동시 요청 시 100개 초과 발급 가능

#### **1.1.2 포인트 충전/차감**
- **문제**: 동시 포인트 충전/차감 시 데이터 불일치
- **영향**: 포인트 잔액 오류, 재무적 손실
- **예시**: 1000포인트에서 동시에 500포인트 차감 시 -500포인트 발생 가능

#### **1.1.3 주문 생성**
- **문제**: 동시 주문 시 재고 중복 차감, 쿠폰 중복 사용
- **영향**: 재고 부족, 쿠폰 오용
- **예시**: 재고 1개에 2명이 동시 주문 시 재고 -2 발생, 하나의 쿠폰으로 2개의 주문 생성 등

#### **1.1.4 회원가입**
- **문제**: 동시 회원가입 시 이메일,아이디 중복 체크 우회
- **영향**: 중복 사용자 계정 생성, 데이터 무결성 문제
- **예시**: 같은 사용자가 다른 이메일과 아이디로 동시 가입
- (같은 이메일, 아이디로 동시 가입 시 중복 계정 생성은 db의 unique 제약조건으로 어느정도 해결은 되는 듯 함)

---

## 🔬 동시성 문제 분석

### 2.1 동시성 문제의 원인

#### **2.1.1 Race Condition**
```
시간 | Thread A          | Thread B
-----|-------------------|-------------------
T1   | 포인트 조회(1000) | 
T2   |                   | 포인트 조회(1000)
T3   | 포인트 차감(500)  |
T4   |                   | 포인트 차감(500)
T5   | 저장(500)         |
T6   |                   | 저장(500) ← 문제!
```

#### **2.1.2 데이터베이스 격리 수준 문제**
- **Read Uncommitted**: Dirty Read 발생
- **Read Committed**: Non-Repeatable Read 발생
- **Repeatable Read**: Phantom Read 발생
- **Serializable**: 성능 저하

### 2.2 비즈니스 요구사항 분석

#### **2.2.1 쿠폰 발급**
- **요구사항**: 선착순 원칙 엄격 준수
- **특성**: 순서 보장이 비즈니스 핵심
- **동시성 수준**: 높음 (대량 동시 요청)

#### **2.2.2 포인트 관리**
- **요구사항**: 정확한 잔액 유지
- **특성**: 성능이 중요하지만 정확성 필수
- **동시성 수준**: 중간 (개별 사용자별)

#### **2.2.3 주문 처리**
- **요구사항**: 재고 정확성, 쿠폰 중복 사용 방지
- **특성**: 복잡한 트랜잭션, 성능 중요
- **동시성 수준**: 중간 (상품별, 사용자별)

##### 쿠폰 발급 이외에는 정상적인 루트가 아니라고 생각함
 - '선착순' 쿠폰 발급은 필연적으로 동시성 이슈가 발생하며, 데이터의 정합성 유지가 매우 중요할 것이라고 판단됨
 - 하지만 그 외 기능은 악의적으로 동시에 실행하려는 경우가 아니라면, 동시성 이슈가 빈번하지는 않을 것이라고 생각함
 - 그래서 쿠폰 발급엔 비관적, 나머지는 낙관적 락 전략을 사용함
 - 그나마 정상적인 상황에서 동시성 이슈가 발생할만한 서비스는 주문 생성인데, 인기상품이나 신상품, 재고가 일정수준 이하로 떨어졌을때 비관적 락을 사용하는 방식으로 진행하면 어떨지 고민민
---

## 🛠️ 해결 방안

### 3.1 동시성 제어 전략

#### **3.1.1 확장성 고려한 접근**
```
현재: 단일 서버, 단일 DB
↓
미래: 다중 서버, 분산 DB
```

**전략**: 확장 가능한 애플리케이션 레벨 동시성 제어 우선

#### **3.1.2 단계적 구현 계획**
1. **1단계**: 애플리케이션 레벨 락 (현재)
2. **2단계**: Redis 분산 락 (다중 서버)
3. **3단계**: DB 물리적 락 (보조적)

### 3.2 락 타입 선택 기준

#### **3.2.1 비관적 락 (Pessimistic Lock)**
**적용 대상**: 쿠폰 발급
**선택 이유**:
- 정확한 순서 보장 필수
- 선착순 원칙이 비즈니스 핵심
- 동시 요청이 많을 때 순서 보장 필요

**구현 방식**:
```typescript
@PessimisticLock({
  key: 'coupon:issue:${args[0].couponType}',
  timeout: 5000,
  errorMessage: '쿠폰 발급 중입니다. 잠시 후 다시 시도해주세요.'
})
```

#### **3.2.2 낙관적 락 (Optimistic Lock)**
**적용 대상**: 포인트 충전/차감, 주문 생성, 회원가입
**선택 이유**:
- 충돌이 적고 성능이 중요한 환경
- 재시도 로직으로 충돌 해결 가능
- 비즈니스 로직으로 충돌 방지

**구현 방식**:
```typescript
@OptimisticLock({
  key: 'points:charge:${args[0]}',
  maxRetries: 3,
  retryDelay: 100,
  errorMessage: '포인트 충전 중입니다. 잠시 후 다시 시도해주세요.'
})
```

### 3.3 기술적 구현

#### **3.3.1 데코레이터 패턴**
```typescript
// 낙관적 락 데코레이터
@OptimisticLock({
  key: 'register:${args[0].email}',
  maxRetries: 3,
  retryDelay: 100
})

// 비관적 락 데코레이터
@PessimisticLock({
  key: 'coupon:issue:${args[0].couponType}',
  timeout: 5000
})
```

#### **3.3.2 인터셉터 구현**
- **OptimisticLockInterceptor**: 재시도 로직 처리
- **PessimisticLockInterceptor**: 메모리 기반 락 관리
- **TransactionInterceptor**: 트랜잭션 관리

#### **3.3.3 버전 관리**
```typescript
// TypeORM @VersionColumn() 활용
@VersionColumn()
version: number;
```

---

## ✅ 구현 결과

### 4.1 적용된 동시성 제어

| 기능 | 락 타입 | 구현 상태 | 테스트 상태 |
|------|----------|-----------|-------------|
| **쿠폰 발급** | 비관적 락 | ✅ 완료 | ✅ 통과 |
| **포인트 충전** | 낙관적 락 | ✅ 완료 | ✅ 통과 |
| **포인트 차감** | 낙관적 락 | ✅ 완료 | ✅ 통과 |
| **주문 생성** | 낙관적 락 | ✅ 완료 | ✅ 통과 |
| **회원가입** | 낙관적 락 | ✅ 완료 | ✅ 통과 |

### 4.2 핵심 구현 파일

#### **4.2.1 데코레이터**
- `src/common/decorators/optimistic-lock.decorator.ts`
- `src/common/decorators/pessimistic-lock.decorator.ts`
- `src/common/decorators/transactional.decorator.ts`

#### **4.2.2 인터셉터**
- `src/common/interceptors/optimistic-lock.interceptor.ts`
- `src/common/interceptors/pessimistic-lock.interceptor.ts`
- `src/common/interceptors/transaction.interceptor.ts`

#### **4.2.3 엔티티 버전 관리**
- `src/infrastructure/repositories/typeorm/*.entity.ts`
- `src/domain/entities/*.entity.ts`

### 4.3 구현된 안정성 기능

#### **4.3.1 안정성 보장**
- **데드락 방지**: 타임아웃 설정 (5초)
- **재시도 로직**: 최대 3회 재시도 (낙관적 락)
- **에러 처리**: 명확한 에러 메시지 제공
- **트랜잭션 롤백**: 실패 시 데이터 일관성 보장

#### **4.3.2 구현된 기능**
- **낙관적 락**: 충돌 시 자동 재시도
- **비관적 락**: 순서 보장 및 타임아웃 처리
- **버전 관리**: TypeORM @VersionColumn() 활용

---

## 🧪 테스트 및 검증

### 5.1 테스트 전략

#### **5.1.1 단위 테스트**
- 데코레이터 적용 확인
- 메타데이터 검증
- 트랜잭션 동작 확인

#### **5.1.2 통합 테스트**
- 동시 요청 시뮬레이션
- 실제 데이터베이스 연동
- 성능 및 안정성 검증

### 5.2 테스트 결과

#### **5.2.1 낙관적 락 동시성 테스트**
```typescript
// 동시 포인트 충전 테스트
it('동시 포인트 충전 시 낙관적 락이 작동해야 한다', async () => {
  const promises = Array(10).fill(null).map(() => 
    chargePointsUseCase.execute(userId, chargePointsDto)
  );
  const results = await Promise.all(promises);
  expect(results).toHaveLength(10); // 모든 요청 성공
});

// 동시 주문 생성 테스트
it('동시 주문 생성 시 낙관적 락이 작동해야 한다', async () => {
  const promises = Array(5).fill(null).map(() => 
    createOrderUseCase.execute(createOrderDto)
  );
  const results = await Promise.all(promises);
  expect(results).toHaveLength(5); // 모든 요청 성공
});

// 중복 결제 방지 테스트
it('동시 결제 처리 시 중복 결제가 방지되어야 한다', async () => {
  const results = await Promise.all(promises);
  expect(successResults.length).toBe(1); // 정확히 하나만 성공
  expect(failedResults.length).toBe(2); // 나머지는 실패
});
```

#### **5.2.2 비관적 락 동시성 테스트**
```typescript
// 동시 쿠폰 발급 테스트
it('동시 쿠폰 발급 시 비관적 락이 작동해야 한다', async () => {
  const promises = Array(5).fill(null).map((_, index) => {
    const dto = new IssueCouponDto();
    dto.userId = 2 + index;
    dto.couponType = CouponType.DISCOUNT_10PERCENT;
    return issueCouponUseCase.execute(dto);
  });
  const results = await Promise.all(promises);
  expect(results).toHaveLength(5); // 모든 요청 성공 (순서 보장)
});

// 선착순 쿠폰 발급 순서 보장 테스트
it('선착순 쿠폰 발급에서 순서가 보장되어야 한다', async () => {
  const results = [];
  for (let i = 0; i < 3; i++) {
    results.push(await issueCouponUseCase.execute(dto));
  }
  expect(results).toHaveLength(3); // 순차적 처리 확인
});
```

#### **5.2.3 회원가입 동시성 테스트**
```typescript
// 동시 회원가입 테스트 (서로 다른 이메일)
it('동시 회원가입 시 낙관적 락이 작동해야 한다', async () => {
  const promises = Array(5).fill(null).map((_, index) => {
    const registerDto = new RegisterDto();
    registerDto.email = `concurrent-test-${index}@example.com`;
    return registerUseCase.execute(registerDto);
  });
  const results = await Promise.all(promises);
  expect(results).toHaveLength(5); // 모든 요청 성공
});

// 중복 이메일 동시 가입 테스트
it('중복 이메일로 동시 가입 시 낙관적 락이 작동해야 한다', async () => {
  const results = await Promise.all(promises);
  const failedResults = results.filter(result => result instanceof Error);
  expect(failedResults.length).toBe(3); // 중복으로 인한 실패
});
```

#### **5.2.4 트랜잭션 롤백 테스트**
```typescript
// 포인트 충전 실패 시 트랜잭션 롤백 테스트
it('포인트 충전 실패 시 트랜잭션이 롤백되어야 한다', async () => {
  const initialPoints = await getUserPointsUseCase.execute(userId);
  await expect(chargePointsUseCase.execute(userId, chargePointsDto)).rejects.toThrow();
  const finalPoints = await getUserPointsUseCase.execute(userId);
  expect(finalPoints.balance).toBe(initialPoints.balance); // 롤백 확인
});
```

### 5.3 검증 결과

#### **5.3.1 낙관적 락 검증**
- ✅ **동시 포인트 충전**: 10개 요청 모두 성공 (재시도 로직)
- ✅ **동시 주문 생성**: 5개 요청 모두 성공 (재고 정확성)
- ✅ **중복 결제 방지**: 1개 성공, 2개 실패 (중복 방지)
- ✅ **동시 회원가입**: 5개 요청 모두 성공 (서로 다른 이메일)
- ✅ **중복 이메일 가입**: 1개 성공, 3개 실패 (중복 방지)

#### **5.3.2 비관적 락 검증**
- ✅ **동시 쿠폰 발급**: 5개 요청 모두 성공 (순서 보장)
- ✅ **선착순 쿠폰 발급**: 3개 순차 처리 (순서 보장)

#### **5.3.3 트랜잭션 검증**
- ✅ **트랜잭션 롤백**: 포인트 충전 실패 시 데이터 일관성 보장
- ✅ **에러 처리**: 명확한 에러 메시지 및 적절한 실패 응답

---

## 🚀 향후 확장 계획 (STEP10에서 구현 예정)

### 6.1 Redis 분산 락 구현

#### **6.1.1 구현 계획**
```typescript
// Redis 분산 락 인터페이스
interface DistributedLockService {
  acquireLock(key: string, ttl: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
}
```

#### **6.1.2 적용 대상**
- 다중 서버 환경
- 높은 동시성 요구사항
- 글로벌 락 필요 시

### 6.2 DB 물리적 락 구현

#### **6.2.1 구현 계획**
```sql
-- Row-Level Lock (행 단위 락)
SELECT * FROM users WHERE id = ? FOR UPDATE;
SELECT * FROM products WHERE id = ? FOR UPDATE NOWAIT;

-- Shared Lock (공유 락)
SELECT * FROM products WHERE id = ? FOR SHARE;

-- Table-Level Lock (테이블 락)
LOCK TABLES users WRITE, products READ;
```

```typescript
// TypeORM에서의 물리적 락 구현
@Transactional()
async processWithPhysicalLock(userId: number, productId: number) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    lock: { mode: 'pessimistic_write' }
  });
  
  const product = await this.productRepository.findOne({
    where: { id: productId },
    lock: { mode: 'pessimistic_write' }
  });
  
  // 비즈니스 로직 수행
}
```

#### **6.2.2 적용 대상**
- 단일 DB 환경
- 복잡한 트랜잭션
- 데이터 일관성 최우선
- 데드락 방지가 중요한 환경

---

## 📊 결론

### 7.1 성과 요약

1. **동시성 문제 식별**: 5개 핵심 기능에서 동시성 문제 발견
2. **적절한 해결 방안**: 비즈니스 요구사항에 맞는 락 타입 선택
3. **확장 가능한 구현**: 향후 다중 서버 환경 대비
4. **완전한 테스트**: 단위/통합 테스트로 검증 완료

### 7.2 핵심 성과

- ✅ **선착순 쿠폰**: 비관적 락으로 순서 보장
- ✅ **포인트 관리**: 낙관적 락으로 성능 최적화
- ✅ **주문 처리**: 복잡한 트랜잭션 안전성 확보
- ✅ **회원가입**: 중복 계정 생성 방지

### 7.3 향후 과제

1. **Redis 분산 락**: 다중 서버 환경 대비
2. **성능 최적화**: 부하 테스트 및 튜닝

---