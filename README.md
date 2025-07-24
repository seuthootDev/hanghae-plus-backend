# 항해+ E-Commerce Backend

## 🏗️ 아키텍처 개요

이 프로젝트는 **Clean Architecture** 패턴을 적용하여 구현된 E-Commerce 백엔드 서비스입니다.

## 🏛️ Clean Architecture 레이어별 책임

### 1. **Domain Layer (도메인 계층)** - 가장 안쪽
**책임**: 핵심 비즈니스 로직과 규칙을 담당

#### 📁 구조
```
src/domain/
├── entities/          # 도메인 엔티티 (핵심 비즈니스 객체)
└── services/          # 도메인 서비스 (복잡한 비즈니스 로직)
```

#### ✅ 구현 가이드라인
- **외부 의존성 금지**: 데이터베이스, HTTP, 외부 라이브러리 직접 사용 금지
- **순수한 비즈니스 로직**: 외부 상태에 의존하지 않는 순수 함수로 구현
- **도메인 규칙 보호**: 비즈니스 규칙을 엔티티와 도메인 서비스에 캡슐화

#### 📝 예시
```typescript
// ✅ 올바른 구현
export class User {
  constructor(
    public readonly id: number,
    public readonly name: string,
    private _points: number = 0
  ) {}

  chargePoints(amount: number): void {
    if (amount < 0) {
      throw new Error('포인트는 음수일 수 없습니다.');
    }
    this._points += amount;
  }

  hasEnoughPoints(amount: number): boolean {
    return this._points >= amount;
  }
}

// ❌ 잘못된 구현 (외부 의존성 포함)
export class User {
  async chargePoints(amount: number): Promise<void> {
    // 데이터베이스 직접 접근 금지
    await this.database.updatePoints(this.id, amount);
  }
}
```

### 2. **Application Layer (애플리케이션 계층)**
**책임**: 유스케이스와 애플리케이션 서비스를 담당

#### 📁 구조
```
src/application/
├── use-cases/         # 유스케이스 (애플리케이션 비즈니스 로직)
└── interfaces/        # 인터페이스 정의
    ├── repositories/  # 리포지토리 인터페이스
    ├── services/      # 서비스 인터페이스
    └── presenters/    # 프레젠터 인터페이스
```

#### ✅ 구현 가이드라인
- **의존성 역전**: 인터페이스를 통해 외부 계층에 의존
- **유스케이스 중심**: 각 기능을 유스케이스로 캡슐화
- **오케스트레이션**: 도메인 객체들을 조합하여 비즈니스 시나리오 구현

#### 📝 예시
```typescript
// ✅ 올바른 구현
@Injectable()
export class ChargePointsUseCase {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface,
    @Inject(USER_PRESENTER)
    private readonly userPresenter: UserPresenterInterface
  ) {}

  async execute(userId: number, chargePointsDto: ChargePointsDto): Promise<PointsResponseDto> {
    const user = await this.usersService.chargePoints(userId, chargePointsDto);
    return this.userPresenter.presentUserPoints(user);
  }
}

// ❌ 잘못된 구현 (도메인 로직을 애플리케이션 계층에 구현)
@Injectable()
export class ChargePointsUseCase {
  async execute(userId: number, amount: number): Promise<void> {
    // 도메인 로직을 여기서 구현하면 안됨
    if (amount < 0) throw new Error('포인트는 음수일 수 없습니다.');
    await this.userRepository.updatePoints(userId, amount);
  }
}
```

### 3. **Infrastructure Layer (인프라스트럭처 계층)**
**책임**: 외부 시스템과의 통신을 담당

#### 📁 구조
```
src/infrastructure/
├── repositories/      # 리포지토리 구현체
├── services/          # 서비스 구현체
└── presenters/        # 프레젠터 구현체
```

#### ✅ 구현 가이드라인
- **인터페이스 구현**: 애플리케이션 계층의 인터페이스를 구현
- **외부 시스템 추상화**: 데이터베이스, 외부 API 등을 추상화
- **기술적 세부사항**: 프레임워크, 라이브러리 의존성을 이 계층에 격리

#### 📝 예시
```typescript
// ✅ 올바른 구현
@Injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  async findById(id: number): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    if (!userEntity) return null;
    
    return new User(
      userEntity.id,
      userEntity.name,
      userEntity.email,
      userEntity.points
    );
  }
}

// ❌ 잘못된 구현 (도메인 로직을 인프라 계층에 구현)
@Injectable()
export class UserRepository {
  async findById(id: number): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    // 도메인 로직을 여기서 구현하면 안됨
    if (userEntity.points < 0) throw new Error('잘못된 포인트');
    return userEntity;
  }
}
```

### 4. **Presentation Layer (프레젠테이션 계층)** - 가장 바깥쪽
**책임**: 사용자 인터페이스와 API 엔드포인트를 담당

#### 📁 구조
```
src/presentation/
├── controllers/       # 컨트롤러 (HTTP 요청/응답 처리)
├── dto/              # 데이터 전송 객체
└── presenters/       # 프레젠터 구현체
```

#### ✅ 구현 가이드라인
- **HTTP 처리**: 요청 검증, 응답 변환만 담당
- **비즈니스 로직 금지**: 비즈니스 로직은 유스케이스에 위임
- **DTO 변환**: 외부 데이터를 내부 도메인 객체로 변환

#### 📝 예시
```typescript
// ✅ 올바른 구현
@Controller('users')
export class UsersController {
  constructor(
    private readonly chargePointsUseCase: ChargePointsUseCase
  ) {}

  @Post(':id/charge')
  async chargePoints(
    @Param('id') userId: number,
    @Body() chargePointsDto: ChargePointsDto
  ): Promise<PointsResponseDto> {
    return this.chargePointsUseCase.execute(userId, chargePointsDto);
  }
}

// ❌ 잘못된 구현 (비즈니스 로직을 컨트롤러에 구현)
@Controller('users')
export class UsersController {
  @Post(':id/charge')
  async chargePoints(@Param('id') userId: number, @Body() dto: any) {
    // 비즈니스 로직을 여기서 구현하면 안됨
    if (dto.amount < 0) throw new BadRequestException();
    const user = await this.userService.findById(userId);
    user.chargePoints(dto.amount);
    await this.userService.save(user);
  }
}
```

## 🔄 의존성 방향

```
Presentation Layer (Controllers)
           ↓
Application Layer (Use Cases)
           ↓
Domain Layer (Entities, Services)
           ↑
Infrastructure Layer (Repositories, External Services)
```

**핵심 원칙**: 의존성은 항상 안쪽(Domain)을 향합니다.

## 🧪 테스트 전략

### 단위 테스트
- **Domain Layer**: 순수 함수 테스트 (Mock 불필요)
- **Application Layer**: Use Case 테스트 (Service, Repository Mock)
- **Infrastructure Layer**: Repository 테스트 (실제 DB 또는 Mock DB)

### 통합 테스트
- **E2E 테스트**: 전체 API 플로우 테스트
- **인메모리 DB**: 테스트 환경에서 실제 DB 대신 인메모리 DB 사용

## 📋 개발 가이드라인

### 1. 새로운 기능 추가 시
1. **Domain Layer**: 엔티티와 도메인 서비스 정의
2. **Application Layer**: 유스케이스와 인터페이스 정의
3. **Infrastructure Layer**: 리포지토리/서비스 구현체 작성
4. **Presentation Layer**: 컨트롤러와 DTO 작성

### 2. 코드 리뷰 체크리스트
- [ ] 도메인 로직이 적절한 계층에 위치하는가?
- [ ] 외부 의존성이 도메인 계층에 침투하지 않았는가?
- [ ] 인터페이스를 통한 의존성 역전이 적용되었는가?
- [ ] 각 계층의 책임이 명확히 분리되었는가?

### 3. 아키텍처 위반 방지
- **Domain Layer**: `@nestjs/common`, `typeorm` 등 외부 라이브러리 import 금지
- **Application Layer**: HTTP 요청/응답 객체 직접 사용 금지
- **Infrastructure Layer**: 도메인 로직 구현 금지
- **Presentation Layer**: 비즈니스 로직 구현 금지

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 테스트 실행
npm run test:unit
npm run test:e2e

# 빌드
npm run build
```

## 📖 API 문서

Swagger UI: http://localhost:3000/api

## �� 라이선스

MIT License
