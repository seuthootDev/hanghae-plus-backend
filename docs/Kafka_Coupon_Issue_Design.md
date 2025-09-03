# Kafka 기반 쿠폰 발급 시스템 설계문서

Kafka의 파티션 기반 순서 보장을 활용하여 동시성 제어와 처리량 향상을 동시에 달성하는 쿠폰 발급 시스템

## 핵심 특징
- **파티션 기반 순서 보장**: 메시지 키를 쿠폰 타입으로 설정하여 같은 쿠폰 타입의 요청들이 같은 파티션에서 순서대로 처리
- **병렬 처리**: 다른 쿠폰 타입의 요청들은 다른 파티션에서 병렬 처리
- **비동기 처리**: 사용자는 즉시 요청 접수 응답을 받고, 실제 발급은 백그라운드에서 처리

## 시스템 아키텍처

### 컴포넌트 구성
- **프로듀서**: 쿠폰 발급 API 서버
- **토픽**: `coupon-issue-request` (요청), `coupon-issue-response` (응답)
- **컨슈머**: 쿠폰 발급 처리 컨슈머

### 파티션 전략
- **메시지 키**: 쿠폰 타입으로 설정
- **파티션 할당**: `hash(couponType) % numberOfPartitions`
- **순서 보장**: 같은 쿠폰 타입의 요청들은 같은 파티션에서 순서대로 처리
- **병렬 처리**: 다른 쿠폰 타입의 요청들은 다른 파티션에서 병렬 처리

## 시퀀스 다이어그램

### 1. 쿠폰 발급 요청 처리

```mermaid
sequenceDiagram
    participant Client as 클라이언트
    participant API as 쿠폰 발급 API
    participant Producer as 카프카 프로듀서
    participant Topic as coupon-issue-request 토픽
    participant Consumer as 쿠폰 발급 컨슈머
    participant Service as 쿠폰 서비스
    participant DB as 데이터베이스

    Client->>API: POST /coupons/issue-async
    Note over Client,API: { userId: 1, couponType: "DISCOUNT_10PERCENT" }
    
    API->>Producer: sendCouponIssueRequest()
    Note over Producer: 메시지 키 = 쿠폰 타입
    
    Producer->>Topic: 메시지 전송
    Note over Topic: 파티션 할당: hash(couponType) % partitions
    
    API-->>Client: 202 Accepted
    Note over Client,API: { requestId: "uuid", status: "PENDING" }
    
    Topic->>Consumer: 메시지 수신
    Note over Consumer: 파티션별 순서 보장
    
    Consumer->>Service: issueCoupon()
    Service->>DB: 쿠폰 발급 처리
    DB-->>Service: 쿠폰 생성 완료
    Service-->>Consumer: 발급 결과
    
    Consumer->>Producer: sendCouponIssueResponse()
    Producer->>Topic: 응답 메시지 전송
```

### 2. 동시 요청 처리 (파티션 기반 순서 보장)

```mermaid
sequenceDiagram
    participant Client1 as 클라이언트1
    participant Client2 as 클라이언트2
    participant Client3 as 클라이언트3
    participant Producer as 카프카 프로듀서
    participant Topic as coupon-issue-request 토픽
    participant Consumer as 쿠폰 발급 컨슈머

    Note over Client1,Consumer: 같은 쿠폰 타입 (DISCOUNT_10PERCENT) 동시 요청
    
    Client1->>Producer: 요청1 (DISCOUNT_10PERCENT)
    Client2->>Producer: 요청2 (DISCOUNT_10PERCENT)
    Client3->>Producer: 요청3 (DISCOUNT_10PERCENT)
    
    Producer->>Topic: 메시지 전송
    Note over Topic: 모든 메시지가 같은 파티션으로 전송<br/>메시지 키 = "DISCOUNT_10PERCENT"
    
    Topic->>Consumer: 순서대로 메시지 전달
    Note over Consumer: 파티션 내에서 순서 보장<br/>요청1 → 요청2 → 요청3 순서로 처리
    
    Consumer->>Consumer: 쿠폰 발급 처리 (순차적)
    Note over Consumer: 동시성 이슈 없이 안전하게 처리
```

### 3. 다른 쿠폰 타입 병렬 처리

```mermaid
sequenceDiagram
    participant Client1 as 클라이언트1
    participant Client2 as 클라이언트2
    participant Client3 as 클라이언트3
    participant Producer as 카프카 프로듀서
    participant Topic as coupon-issue-request 토픽
    participant Consumer1 as 컨슈머1
    participant Consumer2 as 컨슈머2
    participant Consumer3 as 컨슈머3

    Note over Client1,Consumer3: 다른 쿠폰 타입 동시 요청
    
    Client1->>Producer: 요청1 (DISCOUNT_10PERCENT)
    Client2->>Producer: 요청2 (DISCOUNT_20PERCENT)
    Client3->>Producer: 요청3 (FIXED_1000)
    
    Producer->>Topic: 메시지 전송
    Note over Topic: 각각 다른 파티션으로 전송<br/>파티션 0, 1, 2에 분산
    
    Topic->>Consumer1: DISCOUNT_10PERCENT 처리
    Topic->>Consumer2: DISCOUNT_20PERCENT 처리
    Topic->>Consumer3: FIXED_1000 처리
    
    Note over Consumer1,Consumer3: 병렬 처리로 성능 향상
```