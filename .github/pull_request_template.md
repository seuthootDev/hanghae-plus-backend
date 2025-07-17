### **체크리스트**
<!-- 
스스로 만족스러운 과제를 제출했는지 확인하기 위해 체크하는 항목들입니다. 최소한 다음의 기준을 만족시키지 못한다면, 좋은 피드백을 받을 수 없습니다.
-->
- [✔️] 요구사항을 구체화하고 분석하여 작업 가능한 단위로 정리하였는가?
- [✔️] 비즈니스 요구사항을 충족하는 ERD가 작성되었는가?
- [✔️] 핵심 기능에 대한 시퀀스 다이어그램이 작성되었는가?
- [✔️] REST 규칙에 따라서 API를 문서화하였는가? 
- [✔️] 더미데이터를 제공하는 Mock API를 작성하였는가? 

## 📝 커밋 기록

### 스웨거 초기설정: [01d1105](https://github.com/seuthootDev/hanghae-plus-backend/commit/01d11056073418aba366bc68914dbeeb7555c637)
  - 관련 코드 주석처리, 메인에 스웨거 설정 추가


### test 코드 구현: [de668a9](https://github.com/seuthootDev/hanghae-plus-backend/commit/de668a98126760efb1ce3996ab0b4b79e326e435), [9b72e37](https://github.com/seuthootDev/hanghae-plus-backend/commit/9b72e37ff0a93a3022d575b7d7a26b79d037ef4e), [abc7058](https://github.com/seuthootDev/hanghae-plus-backend/commit/abc70588fd14a5e1eb32c45c69c126558ad6a639)
  - Users, Products, Orders, Payments, Coupons API E2E 테스트 구현
  - it.each를 활용한 깔끔한 테스트 코드 작성
  - 예외 처리 및 경로 검증 테스트 추가

### Mock API 구현: [0cf5c4b](https://github.com/seuthootDev/hanghae-plus-backend/commit/0cf5c4b2626719c282f698d8ce78b0b992dc2fa5), [f005942](https://github.com/seuthootDev/hanghae-plus-backend/commit/f005942f512b0ddae4acfd5e9c7e8b5437a1e573), [39db025](https://github.com/seuthootDev/hanghae-plus-backend/commit/39db0259486c47e4486109a4fff32d19fac6609e), [e54ced5](https://github.com/seuthootDev/hanghae-plus-backend/commit/e54ced5f3765ddef821845b7e735718c6fb5ffdb), [dc95e87](https://github.com/seuthootDev/hanghae-plus-backend/commit/dc95e8769644ba09c35ffeaa243807c373b98cd2)
  - Users, Products, Orders, Payments, Coupons 서비스 구현
  - NestJS 예외 클래스(BadRequestException, NotFoundException) 활용
  - Mock 비즈니스 로직으로 실제 API 동작 시뮬레이션

## 🔍 리뷰 포인트

### 1. FK 관련 질문
- FK를 제거하면 조인이 많이 일어날 것 같은데, 성능 이슈는 어떻게 될지 궁금합니다.

### 2. 서비스 계층의 책임 분리
- 쿠폰 관련 로직을 쿠폰 서비스에 집중하면, 의존성 주입이 여러 군데에서 발생하게 되는데 이 방식이 올바른 설계인지 궁금합니다.
- (쿠폰을 주문 서비스에서 처리하는 게 나을지, 혹은 쿠폰 서비스가 책임지는 게 맞는지)
- 결제 대기가 있는 웹사이트를 참고해서 주문 생성과 결제 과정을 분리했는데, 이 구조가 실무를 잘 반영하고 있는지 궁금합니다.

### 3. 테스트 전략 (Step4)
- Mock API 단계에서 테스트 컨테이너를 활용해야 하는지 궁금합니다. (Step4)

## 📊 이번주 KPT 회고

### Keep (유지할 점)
- 요구사항을 단계별로 분석하고 설계한 점
- 다이어그램 간의 일관성을 유지하면서 개선한 점 
- it.each를 활용한 깔끔한 테스트 코드 작성 (Step4)
- NestJS 예외 클래스를 활용한 적절한 에러 처리 (Step4)

### Problem (개선할 점)
- 시퀀스 다이어그램의 목적을 처음에는 전체 프로세스의 흐름을 한눈에 보여주는 것이라고 생각했지만 너무 복잡해져서 가독성이 매우 떨어졌음
- 기능별로 쪼개 명확하게 기능별 흐름을 보여주는게 더 효과적이라고 판단하여 구조를 변경
- step03 브런치에 step04 관련 작업 [01d1105](https://github.com/seuthootDev/hanghae-plus-backend/commit/01d11056073418aba366bc68914dbeeb7555c637) 이 커밋됨....  `git switch` + `git cherry-pick`을 사용하는 것에 익숙해져야함 (Step04)
### Try (새롭게 시도할 점)
- prisma-markdown, nestia 등 자동 문서화 도구 사용해보기
- 테스트 컨테이너를 활용한 실제 데이터베이스를 사용하는 테스트 해보기 (Step4)