# 항해플러스 백엔드

Clean Architecture 패턴을 적용한 NestJS 기반 백엔드 애플리케이션입니다.

## 🏗️ 아키텍처

### Clean Architecture 레이어 구조

#### **1. Domain Layer (도메인 계층)**
- **책임**: 비즈니스 로직의 핵심 규칙과 엔티티 정의
- **구성요소**:
  - `entities/`: 비즈니스 엔티티 (User, Product, Order, Coupon, Payment, AuthToken)
  - `services/`: 도메인 서비스 (검증 로직, 비즈니스 규칙)
  - `value-objects/`: 값 객체들

#### **2. Application Layer (애플리케이션 계층)**
- **책임**: 유스케이스 구현 및 비즈니스 워크플로우 조정
- **구성요소**:
  - `use-cases/`: 애플리케이션 유스케이스들
  - `interfaces/`: 추상화된 인터페이스들 (Repository, Service, Presenter)

#### **3. Infrastructure Layer (인프라스트럭처 계층)**
- **책임**: 외부 시스템과의 통신 및 데이터 접근
- **구성요소**:
  - `repositories/`: 데이터 접근 구현체 (TypeORM, Mock)
  - `services/`: 외부 서비스 구현체
  - `presenters/`: 데이터 변환 로직

#### **4. Presentation Layer (프레젠테이션 계층)**
- **책임**: HTTP 요청/응답 처리 및 API 엔드포인트 정의
- **구성요소**:
  - `controllers/`: API 컨트롤러들
  - `dto/`: 데이터 전송 객체들

### 의존성 방향
```
Presentation → Application → Domain
     ↓              ↓
Infrastructure → Application → Domain
```

## 📁 전체 프로젝트 구조

```
hanghae-plus-backend/
├── docs/                           # 프로젝트 문서
├── migrations/                     # 데이터베이스 마이그레이션
├── src/
│   ├── application/                # 애플리케이션 계층
│   │   ├── interfaces/             # 추상화된 인터페이스들
│   │   │   ├── repositories/       # 리포지토리 인터페이스
│   │   │   ├── services/           # 서비스 인터페이스
│   │   │   └── presenters/         # 프레젠터 인터페이스
│   │   └── use-cases/              # 유스케이스들
│   │       ├── auth/               # 인증 관련 유스케이스
│   │       ├── coupons/            # 쿠폰 관련 유스케이스
│   │       ├── orders/             # 주문 관련 유스케이스
│   │       ├── payments/           # 결제 관련 유스케이스
│   │       ├── products/           # 상품 관련 유스케이스
│   │       └── users/              # 사용자 관련 유스케이스
│   ├── config/                     # 설정 파일들
│   ├── database/                   # 데이터베이스 설정
│   ├── domain/                     # 도메인 계층
│   │   ├── entities/               # 비즈니스 엔티티
│   │   ├── services/               # 도메인 서비스
│   │   └── value-objects/          # 값 객체들
│   ├── infrastructure/             # 인프라스트럭처 계층
│   │   ├── repositories/           # 데이터 접근 구현체
│   │   │   ├── mock/               # Mock 리포지토리
│   │   │   └── typeorm/            # TypeORM 리포지토리
│   │   ├── services/               # 외부 서비스 구현체
│   │   │   ├── mock/               # Mock 서비스
│   │   │   └── real/               # 실제 서비스
│   │   └── presenters/             # 데이터 변환 로직
│   └── presentation/               # 프레젠테이션 계층
│       ├── controllers/            # API 컨트롤러들
│       ├── dto/                    # 데이터 전송 객체들
│       │   ├── authDTO/            # 인증 관련 DTO
│       │   ├── couponsDTO/         # 쿠폰 관련 DTO
│       │   ├── ordersDTO/          # 주문 관련 DTO
│       │   ├── paymentsDTO/        # 결제 관련 DTO
│       │   ├── productsDTO/        # 상품 관련 DTO
│       │   └── usersDTO/           # 사용자 관련 DTO
│       └── presenters/             # 응답 변환 로직
├── test/                           # 테스트 파일들
│   ├── it/                         # 통합 테스트
│   │   ├── api/                    # API 테스트
│   │   ├── database/               # 데이터베이스 테스트
│   │   └── example/                # 예시 테스트
│   └── unit/                       # 단위 테스트
└── .github/                        # GitHub 관련 파일들
    └── pull_request_template.md    # PR 템플릿
```


### 테스트 실행
```
npm run test:unit
npm run test:integration   
```