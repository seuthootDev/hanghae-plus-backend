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

## 🚀 시작하기

### 1. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경변수들을 설정하세요:

```bash
# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 비밀번호 해싱 설정
BCRYPT_SALT_ROUNDS=10

# 관리자 계정 설정
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=admin

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=hanghae_plus
DB_LOGGING_ENABLED=false

# 애플리케이션 설정
PORT=3000
NODE_ENV=development
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 데이터베이스 설정

```bash
# 데이터베이스 마이그레이션 실행
npm run migration:run

# 초기 데이터 시딩
npm run seed
```

### 4. 애플리케이션 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run start:prod
```

## 🐳 Docker 사용법

### 개발 환경

```bash
# Docker Compose로 개발 환경 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 프로덕션 환경

```bash
# 프로덕션 환경변수 파일 생성
cp docker.env .env.prod

# .env.prod 파일에서 프로덕션 값들로 수정
# 특히 JWT_SECRET, DB_PASSWORD 등 보안 관련 값들

# 프로덕션 환경 실행
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Docker 환경변수 설정

Docker Compose는 자동으로 `.env` 파일을 읽어서 환경변수를 설정합니다:

```bash
# 기본 .env 파일 사용
docker-compose up

# 특정 환경변수 파일 사용
docker-compose --env-file .env.prod up

# 환경변수 직접 전달
DB_PASSWORD=mypassword docker-compose up
```

## 📚 API 문서

애플리케이션 실행 후 다음 URL에서 Swagger API 문서를 확인할 수 있습니다:

```
http://localhost:3000/api
```

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 🔐 인증 시스템

### JWT 기반 인증
- **액세스 토큰**: 24시간 유효
- **리프레시 토큰**: 7일 유효
- **비밀번호 해싱**: bcrypt (Salt Rounds: 10)

### API 엔드포인트
- `POST /auth/register`: 회원가입
- `POST /auth/login`: 로그인
- `POST /auth/refresh`: 토큰 갱신
- `POST /auth/logout`: 로그아웃

## 📁 프로젝트 구조

```
src/
├── application/          # 애플리케이션 계층
│   ├── interfaces/       # 추상화된 인터페이스들
│   └── use-cases/        # 유스케이스들
├── domain/              # 도메인 계층
│   ├── entities/        # 비즈니스 엔티티
│   └── services/        # 도메인 서비스
├── infrastructure/      # 인프라스트럭처 계층
│   ├── repositories/    # 데이터 접근 구현체
│   ├── services/        # 외부 서비스 구현체
│   └── presenters/      # 데이터 변환 로직
├── presentation/        # 프레젠테이션 계층
│   ├── controllers/     # API 컨트롤러
│   └── dto/            # 데이터 전송 객체
└── config/             # 설정 파일들
    └── env.config.ts   # 환경변수 설정
```

## 🔧 개발 가이드라인

### 1. 새로운 기능 추가 시
1. **Domain Layer**: 엔티티 및 도메인 서비스 정의
2. **Application Layer**: 유스케이스 및 인터페이스 정의
3. **Infrastructure Layer**: 구체적인 구현체 작성
4. **Presentation Layer**: API 엔드포인트 및 DTO 정의

### 2. 의존성 주입
- 인터페이스는 Application Layer에서 정의
- 구현체는 Infrastructure Layer에서 작성
- DI 컨테이너를 통해 의존성 주입

### 3. 테스트 작성
- **단위 테스트**: 각 레이어별 독립적 테스트
- **E2E 테스트**: 전체 API 플로우 테스트
- **Mock 사용**: 외부 의존성 격리

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.
